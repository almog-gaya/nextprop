export const smsTemplatesByObjective = {
  "Re-Engaging Realtors": [
    "Hey {{first_name}}, I'm reaching out about a property at {{street_name}} in {{city}}. Do you have any other listings we could look at? Thank you.",
    
    "Hey {{first_name}}, we're actively looking for more investment opportunities. We saw properties in {{city}}—any other distressed or off-market properties that need TLC before they go public? We can move quickly!",
    
    "Hey {{first_name}}, checking in about properties in {{city}}, {{state}}. Do you have any new listings or fixer-uppers that might be a great fit for an investor before they hit the market? Let me know!",
    
    "Hey {{first_name}}, I'm following up about properties in {{city}}. Do you have any upcoming off-market deals or distressed properties that might be a good fit? Always great to do business with you!",
    
    "Hey {{first_name}}, looking for properties like those in {{postal_code}}. Any off-market, fixer-uppers, or TLC opportunities you're working on? Would love to put in an offer early."
  ],
  
  "Targeting Distressed Listings": [
    "Hi {{first_name}}, I'm reaching out about a property at {{street_name}}. I noticed it's been on the market for a while. Would your seller consider an offer on terms? Just to confirm, your commission is still fully covered.",
    
    "Hi {{first_name}}, I saw a property at {{street_name}} in {{city}} has been sitting for a while and wanted to see if your seller might be open to an offer on terms. Your commission would be fully covered. Let me know if this is something worth exploring!",
    
    "Hi {{first_name}}, I noticed a property in {{city}}, {{state}} has been listed for some time. I wanted to see if your seller would consider a terms offer. Of course, your commission remains fully paid. Let me know if we can discuss further!",
    
    "Hey {{first_name}}, regarding the property in {{postal_code}}. If the seller is open to terms, I might have a solution that works for everyone—and your commission stays intact. Let me know if they'd consider it!"
  ]
};

export type ObjectiveType = keyof typeof smsTemplatesByObjective; 