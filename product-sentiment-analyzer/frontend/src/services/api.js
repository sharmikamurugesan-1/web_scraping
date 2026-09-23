import axios from 'axios';

// In development, Vite proxies /api to http://127.0.0.1:5000
const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Health
  async getHealth() {
    const res = await client.get('/health');
    return res.data;
  },

  // Presets
  async getPresets() {
    const res = await client.get('/products/presets');
    return res.data;
  },

  // Analyze Product
  async analyzeProduct({ query_or_url, source = 'Amazon', max_reviews = 40 }) {
    const res = await client.post('/products/analyze', {
      query_or_url,
      source,
      max_reviews,
    });
    return res.data;
  },

  // List Analyzed Products
  async listProducts(limit = 100) {
    const res = await client.get('/products', { params: { limit } });
    return res.data;
  },

  // Get Product Dashboard
  async getProduct(productId) {
    const res = await client.get(`/products/${productId}`);
    return res.data;
  },

  // Get Filtered Reviews (sentiment, rating, search, aspect, limit)
  async getReviews(productId, params = {}) {
    const res = await client.get(`/products/${productId}/reviews`, { params });
    return res.data;
  },

  // Get Customer Insights (Pain Points & Loved Features)
  async getInsights(productId) {
    const res = await client.get(`/products/${productId}/insights`);
    return res.data;
  },

  // Get Product Health Score
  async getHealthScore(productId) {
    const res = await client.get(`/products/${productId}/health-score`);
    return res.data;
  },

  // Get AI Review Summary
  async getSummary(productId) {
    const res = await client.get(`/products/${productId}/summary`);
    return res.data;
  },

  // Get Alerts
  async getAlerts(productId) {
    const res = await client.get(`/products/${productId}/alerts`);
    return res.data;
  },

  // Compare 2 to 3 Products
  async compareProducts(productIds) {
    // If productIds is an array
    if (Array.isArray(productIds)) {
      const res = await client.post('/products/compare', {
        product_ids: productIds,
      });
      return res.data;
    }
    // Backward compatibility for compareProducts(id1, id2)
    const res = await client.post('/products/compare', {
      product_id_1: arguments[0],
      product_id_2: arguments[1],
    });
    return res.data;
  },

  // Export URLs
  getExportCsvUrl(productId) {
    return `/api/products/${productId}/export?format=csv`;
  },

  getExportJsonUrl(productId) {
    return `/api/products/${productId}/export?format=json`;
  },

  // Backward compatibility alias
  getExportUrl(productId) {
    return `/api/products/${productId}/export?format=csv`;
  },

  // Delete Product
  async deleteProduct(productId) {
    const res = await client.delete(`/products/${productId}`);
    return res.data;
  },

  // Interactive Live Sentiment Playground
  async testSentiment(text) {
    const res = await client.post('/sentiment/analyze', { text });
    return res.data;
  },
};

export default api;
