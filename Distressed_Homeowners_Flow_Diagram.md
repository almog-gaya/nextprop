# Distressed Homeowners Pipeline Flow Diagram

## Overview
This diagram represents the flow of the Distressed Homeowners lead management pipeline, outlining the process from initial contact through conversion.

## Diagram

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                                                                                                       |
|                              DISTRESSED HOMEOWNERS PIPELINE WORKFLOW                                                   |
|                                                                                                                       |
+-----------------------------------------------------------------------------------------------------------------------+

+------------------+      +------------------+      +--------------------+      +------------------------+
|  If condition:   |      |                  |      |                    |      |                        |
| Homeowner        +----->+  Client brings   +----->+  Unique pipeline  +----->+  Special dashboard     |
| engagement       |      |  the contact     |      |  for this          |      |  for this scenario     |
| (Client upload)  |      |  list            |      |  strategy          |      |                        |
+------------------+      +------------------+      +--------------------+      +------------------------+
                                                                                        ^
                                                                                        |
                                                                                        |
                                                                                        v
+---------------------------------------------------------------------------------------------------+
|                                     PIPELINE STAGES                                               |
|                                                                                                   |
|  1. Voicemail Received           6. Second Engagement         11. Contract Sent                   |
|  2. Undeliverable                7. Contact Made              12. DD (Contract Signed)            |
|  3. Call Back                    8. Meeting Scheduled         13. Money in Escrow                 |
|  4. SMS Back                     9. Follow Up                 14. Closed                          |
|  5. Motivation (Lead)           10. Negotiation                                                   |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
                                            |
                                            |
                                            v
              +------------------------+    |    +------------------------+
              |                        |    |    |                        |
              |   Response Handling    |<---+    |     Task Management    |
              |                        |         |                        |
              +------------------------+         +------------------------+
                          |                                 |
                          |                                 |
          +---------------+---------------+                 |
          |                               |                 |
          v                               v                 v
+-------------------+            +-------------------+    +-------------------+
|                   |            |                   |    | * Unread messages |
|      AI Bot       |            |      Human        |    | * Missed calls    |
|      handling     |<---------->|      handling     |    | * Overdue tasks   |
|                   |            |                   |    | * Notifications   |
+-------------------+            +-------------------+    +-------------------+


                    DASHBOARD METRICS
+---------------------------------------------------+
|                                                   |
| * Contacts without voicemail                      |
| * Contacts with voicemail                         |
| * Leads (Motivation Stage)                        |
| * Closed deals                                    |
| * Send-out timing and quantities                  |
| * Contact list depletion forecast                 |
|                                                   |
+---------------------------------------------------+


                    FEATURE HIGHLIGHTS
+---------------------------------------------------+
|                                                   |
| * Realistic voice (GPT-powered)                   |
| * Client-provided script                          |
| * Customizable fields (name, address)             |
| * Client controls timing and volume               |
|                                                   |
+---------------------------------------------------+
```

## Implementation Notes

### Automation Points
- Currently only select stages have automation (those marked in bold in original diagram)
- The Motivation stage is defined as the "Lead" stage in the system
- Response handling is divided between AI and human touchpoints

### Key Decision Points
1. **Response Type**: System determines whether responses are handled by AI or human
2. **Contact Frequency**: System manages timing and volume based on client settings
3. **Notification Triggers**: System determines when client involvement is required

### Dashboard Functionality
The dashboard provides real-time metrics on:
- Pipeline stage distribution
- Contact status
- Lead generation
- Deal closure rates
- Resource planning for contact list management

## Next Steps
- Define specific automation rules for each stage
- Develop notification templates
- Create AI response handling logic
- Design human handoff protocols
- Implement dashboard visualization components 