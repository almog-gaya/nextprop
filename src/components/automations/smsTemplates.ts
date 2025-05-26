export const smsTemplatesByObjective = {
  "For Realtors - Re-Engagement": [
    "Hey {{first_name}}, I'm reaching out about a property we discussed earlier. Do you have any other listings we could look at? Thank you.",
    
    "Hey {{first_name}}, we're actively looking for more investment opportunities. Do you have any distressed or off-market properties that need work before they go public? We can move quickly!",
    
    "Hey {{first_name}}, checking in to see if you have any new listings or fixer-uppers that might be a great fit for an investor before they hit the market. Let me know!",
    
    "Hey {{first_name}}, I'm following up about potential properties. Do you have any upcoming off-market deals or distressed properties that might be a good fit? Always great to do business with you!",
    
    "Hey {{first_name}}, we're looking for investment properties. Any off-market, fixer-uppers, or TLC opportunities you're working on? Would love to put in an offer early."
  ],
  
  "For Realtors - Distressed Listings": [
    "Hi {{first_name}}, I'm reaching out about a property that's been on the market for a while. Would your seller consider an offer on terms? Your commission would still be fully covered.",
    
    "Hi {{first_name}}, I noticed you have a property that's been listed for some time and wanted to see if your seller might be open to an offer on terms. Your commission would be fully covered. Let me know if this is worth exploring!",
    
    "Hi {{first_name}}, regarding your listing that's been on the market for a while. I wanted to see if your seller would consider a terms offer. Of course, your commission remains fully paid. Let me know if we can discuss further!",
    
    "Hey {{first_name}}, I noticed you have a property that's been on the market for some time. If the seller is open to terms, I might have a solution that works for everyone—and your commission stays intact. Let me know if they'd consider it!"
  ],
  
  "Distressed Homeowners": [
    "Hey {{first_name}}, I just tried reaching you about your property at {{street_name}}. I wanted to see if you'd be open to discussing some options, whether it's a cash offer or something creative. Give me a call back whenever it works for you. Take care!"
  ],
  
  "Off Market Deals": [
    "Hey {{first_name}}, I have an off-market deal you might be interested in...",
    "Hi {{first_name}}, exclusive off-market property available..."
  ],
  
  "Short Sales": [
    "Hi {{first_name}}, are you interested in short sale opportunities?",
    "Hello {{first_name}}, let's talk about short sale deals..."
  ],
  
  "Creative Finance": [
    "Hi {{first_name}}, interested in creative financing options?",
    "Hello {{first_name}}, let's discuss creative finance deals..."
  ],
  
  "Cash Buyers": [
    "Hi {{first_name}}, I have a cash buyer opportunity for you...",
    "Hello {{first_name}}, exclusive cash buyer deal available..."
  ],
  
  "For Home Owners": [
    "Hi {{first_name}}, are you considering selling your home at {{street_name}}?",
    "Hello {{first_name}}, let's discuss your property options for {{street_name}} in {{city}}..."
  ],
  
  "Cash Offer": [
    "Hi {{first_name}}, interested in a quick cash offer for your property at {{street_name}}?",
    "Hello {{first_name}}, we can provide a cash offer quickly for your home in {{city}}..."
  ],
  
  "Distressed Seller": [
    "Hi {{first_name}}, facing challenges with your property at {{street_name}}? We can help...",
    "Hello {{first_name}}, let's discuss solutions for your property at {{street_name}} in {{city}}..."
  ],
  
  "Relocation": [
    "Hi {{first_name}}, relocating from {{city}}? We can assist with your property at {{street_name}}...",
    "Hello {{first_name}}, let's discuss your relocation needs and options for your property..."
  ]
};

export type ObjectiveType = keyof typeof smsTemplatesByObjective; 