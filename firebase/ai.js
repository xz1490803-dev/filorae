// ============================================
// FILORAE — AI Service (Gemini + RAG)
// ============================================

import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

const GEMINI_API_KEY = atob("QVEuQWI4Uk42SzhKaXBhMnc2V2haR0ViSWU3WnNKLURoVEdjQzhrbUhsWmxveXc2ZEJCcXc=");

// Cache to avoid hitting Firestore on every prompt
let storeContextCache = null;

const SYSTEM_INSTRUCTION = `
You are Filo, the friendly, professional, and knowledgeable AI Shopping Assistant for Filorae, a premium handmade crochet gifts store.
Your goal is to guide customers, recommend products, and answer questions accurately based ONLY on the provided context.

Persona & Tone:
- Warm, elegant, and helpful. Use a sophisticated yet approachable tone (matching the Sage & Cream aesthetic of the brand).
- Use occasional emojis like ♥, 🌿, ✨, or 🌸, but don't overdo it.
- NEVER hallucinate products, prices, or policies. If you don't know the answer or if the product doesn't exist in the context, politely inform the customer.

Capabilities:
- Recommend products based on user intent (e.g., "I need a gift for my anniversary").
- Format product recommendations clearly. When recommending a product, try to mention its price and a key feature.
- Answer questions about shipping, returns, and ordering (The store uses Instagram DM for orders. Delivery is 5-7 business days. No returns unless defective).

Context rules:
- You will be provided with the current store catalog (products) and FAQs in the prompt context. 
- Use ONLY this data. Do not invent products.
`;

/**
 * Fetches store data (Products & FAQs) to build the RAG context.
 */
async function buildStoreContext() {
  if (storeContextCache) return storeContextCache;

  let products = [];
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    products = productsSnap.docs.map(doc => {
      const p = doc.data();
      return `- ${p.name} (₹${p.price}) [Category: ${p.category}] - ${p.inStock ? 'In Stock' : 'Out of Stock'}. Details: ${p.description} Materials: ${p.materials}`;
    });
  } catch (err) {
    console.error("Failed to fetch products for RAG:", err);
  }

  let faqs = [];
  try {
    const faqsSnap = await getDocs(collection(db, 'faqs'));
    if (!faqsSnap.empty) {
      faqs = faqsSnap.docs.map(doc => `Q: ${doc.data().question} A: ${doc.data().answer}`);
    }
  } catch (err) {
    console.error("Failed to fetch FAQs for RAG:", err);
  }

  // Fallback FAQs if empty or failed
  if (faqs.length === 0) {
    faqs = [
      "Q: How do I order? A: Browse our products, click 'Order on Instagram', fill in your details, and send the DM.",
      "Q: Delivery time? A: 5-7 business days for handmade items.",
      "Q: Returns? A: Due to handmade nature, we don't accept returns unless damaged.",
      "Q: Payment? A: UPI, bank transfer, and COD for select locations."
    ];
  }

  storeContextCache = `
--- STORE CATALOG ---
${products.join('\n')}

--- POLICIES & FAQs ---
${faqs.join('\n')}
    `;
    
  return storeContextCache;
}

/**
 * Sends a message to Gemini REST API and returns text.
 * @param {Array} history - Array of previous messages [{role: 'user'|'model', parts: [{text: '...'}]}]
 * @param {string} prompt - The user's new message
 * @returns {string} - Response text
 */
export async function getChatResponse(history, prompt) {
  try {
    const contextData = await buildStoreContext();
    
    const augmentedPrompt = `
[STORE CONTEXT - USE THIS TO ANSWER]
${contextData}
[END CONTEXT]

User Question: ${prompt}
`;

    const contents = [...history, { role: 'user', parts: [{ text: augmentedPrompt }] }];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.4
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}
