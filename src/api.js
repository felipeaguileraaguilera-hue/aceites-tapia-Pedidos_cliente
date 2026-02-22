import { supabase } from './supabaseClient'

// ============================================================
// AUTH
// ============================================================
export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password })
}
export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}
export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
}
export async function signOut() { return await supabase.auth.signOut() }
export function onAuthChange(cb) { return supabase.auth.onAuthStateChange(cb) }
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ============================================================
// PROFILE
// ============================================================
export async function getClientProfile(authUserId) {
  const { data, error } = await supabase.from('clients')
    .select('*, price_levels(name, discount_pct), zones(name, delivery_day)')
    .eq('auth_user_id', authUserId).single()
  return { data, error }
}
export async function createClientProfile(authUserId, profile) {
  const { data, error } = await supabase.from('clients').insert({
    auth_user_id: authUserId, email: profile.email, name: profile.name,
    contact_person: profile.contact_person || '', phone: profile.phone || '',
    address: profile.address || '', wants_invoice_default: profile.wants_invoice_default ?? true,
    role: 'client', price_level_id: 'silver', is_active: true,
  }).select().single()
  return { data, error }
}
export async function updateClientProfile(clientId, updates) {
  return await supabase.from('clients').update(updates).eq('id', clientId).select().single()
}

// ============================================================
// PRODUCTS
// ============================================================
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').eq('active', true).order('display_order')
  return { data, error }
}

// ============================================================
// DELIVERY POINTS
// ============================================================
export async function getDeliveryPoints(clientId) {
  const { data, error } = await supabase.from('delivery_points')
    .select('*').eq('client_id', clientId).eq('active', true).order('is_default', { ascending: false })
  return { data, error }
}
export async function createDeliveryPoint(point) {
  return await supabase.from('delivery_points').insert(point).select().single()
}
export async function updateDeliveryPoint(id, updates) {
  return await supabase.from('delivery_points').update(updates).eq('id', id).select().single()
}
export async function deleteDeliveryPoint(id) {
  return await supabase.from('delivery_points').update({ active: false }).eq('id', id)
}

// ============================================================
// ORDERS
// ============================================================
export async function createOrder(clientId, items, wantsInvoice, notes, deliveryPointId) {
  const { data: idData, error: idError } = await supabase.rpc('next_order_id')
  if (idError) return { data: null, error: idError }
  const orderId = idData

  const { data: client } = await supabase.from('clients')
    .select('price_level_id, price_levels(discount_pct)').eq('id', clientId).single()
  const discountPct = client?.price_levels?.discount_pct || 0

  let totalBase = 0, totalVat = 0
  const orderItems = []
  for (const item of items) {
    const { data: product } = await supabase.from('products').select('base_price, vat_rate').eq('id', item.productId).single()
    const basePrice = product?.base_price || 0
    const vatRate = product?.vat_rate || 0.04
    const unitPrice = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100
    const lineBase = Math.round(unitPrice * item.qty * 100) / 100
    const lineVat = Math.round(lineBase * vatRate * 100) / 100
    totalBase += lineBase; totalVat += lineVat
    orderItems.push({
      order_id: orderId, product_id: item.productId, quantity: item.qty,
      original_quantity: item.qty, unit_price: unitPrice, vat_rate: vatRate,
      discount_pct: discountPct, line_base: lineBase, line_vat: lineVat,
      line_total: Math.round((lineBase + lineVat) * 100) / 100
    })
  }

  const { data: order, error: orderError } = await supabase.from('orders').insert({
    id: orderId, client_id: clientId, status: 'pending',
    wants_invoice: wantsInvoice, notes: notes || '',
    delivery_point_id: deliveryPointId || null,
    total_base: Math.round(totalBase * 100) / 100,
    total_vat: Math.round(totalVat * 100) / 100,
    total_amount: Math.round((totalBase + totalVat) * 100) / 100,
    discount_pct: discountPct, created_by: 'client'
  }).select().single()
  if (orderError) return { data: null, error: orderError }

  await supabase.from('order_items').insert(orderItems)
  await supabase.from('order_history').insert({
    order_id: orderId, action: 'created', changed_by: clientId, changes: { items: orderItems }
  })
  return { data: order, error: null }
}

export async function getClientOrders(clientId, filters = {}) {
  let query = supabase.from('orders')
    .select('*, delivery_points(name, address), order_items(product_id, quantity, unit_price, vat_rate, line_base, line_vat, line_total)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59')
  if (filters.deliveryPointId) query = query.eq('delivery_point_id', filters.deliveryPointId)
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  return { data, error }
}

export async function cancelOrder(orderId, clientId) {
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('status', 'pending')
  if (!error) await supabase.from('order_history').insert({ order_id: orderId, action: 'cancelled', changed_by: clientId, changes: {} })
  return { error }
}

// ============================================================
// DASHBOARD DATA
// ============================================================
export async function getDashboardData(clientId, dateFrom, dateTo, deliveryPointId) {
  let query = supabase.from('orders')
    .select('id, status, created_at, delivered_at, wants_invoice, total_base, total_vat, total_amount, delivery_payment, delivery_point_id, order_items(product_id, quantity, unit_price, line_base, line_vat, line_total)')
    .eq('client_id', clientId)
    .neq('status', 'cancelled')

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
  if (deliveryPointId) query = query.eq('delivery_point_id', deliveryPointId)

  const { data, error } = await query
  return { data, error }
}
