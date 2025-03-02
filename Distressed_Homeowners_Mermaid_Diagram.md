# Distressed Homeowners Pipeline - Mermaid Diagram

This file contains a modern, interactive diagram of the Distressed Homeowners Pipeline workflow using mermaid syntax.

## Flow Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f0f0f0', 'primaryTextColor': '#323232', 'primaryBorderColor': '#7B68EE', 'lineColor': '#7B68EE', 'secondaryColor': '#e0e0e0', 'tertiaryColor': '#f9f9f9' }}}%%

flowchart TB
    subgraph "Initial Process"
        A["Homeowner Engagement<br/>(Client will upload)"] --> B["Client brings<br/>the contact list"]
        B --> C["Unique pipeline<br/>for this strategy"]
        C --> D["Special dashboard<br/>for this scenario"]
    end

    subgraph "Pipeline Stages"
        direction TB
        P1["1. Voicemail Received"] --> P2["2. Undeliverable"]
        P1 --> P3["3. Call Back"]
        P1 --> P4["4. SMS Back"]
        P3 --> P5["5. Motivation (Lead)"]
        P4 --> P5
        P5 --> P6["6. Second Engagement"]
        P6 --> P7["7. Contact Made"]
        P7 --> P8["8. Meeting Scheduled"]
        P8 --> P9["9. Follow Up"]
        P9 --> P10["10. Negotiation"]
        P10 --> P11["11. Contract Sent"]
        P11 --> P12["12. DD (Contract Signed)"]
        P12 --> P13["13. Money in Escrow"]
        P13 --> P14["14. Closed"]
    end

    D --> P1
    
    subgraph "Response Handling"
        direction TB
        R1["SMS Response"] --> R2["AI Bot"]
        R1 --> R3["Text goes to client<br/>to handle manually"]
    end
    
    P4 --> R1
    
    subgraph "Task Management"
        direction TB
        T1["Unread messages"]
        T2["Missed calls with<br/>no callback"]
        T3["Overdue tasks"]
        T4["Upload new contacts<br/>before list runs out"]
        T5["Client involvement<br/>notification"]
        T6["New lead notification<br/>(Motivation stage)"]
    end
    
    D --> Task_Connection["Dashboard<br/>Integration"]
    Task_Connection --> T1
    Task_Connection --> T2
    Task_Connection --> T3
    Task_Connection --> T4
    Task_Connection --> T5
    Task_Connection --> T6
    
    subgraph "Dashboard Metrics"
        direction TB
        M1["Contacts without<br/>voicemail"]
        M2["Contacts with<br/>voicemail"]
        M3["Leads<br/>(Motivation Stage)"]
        M4["Closed deals"]
        M5["Send-out timing<br/>and quantities"]
        M6["Contact list<br/>depletion forecast"]
    end
    
    D --> Dashboard_Connection["Metrics<br/>Display"]
    Dashboard_Connection --> M1
    Dashboard_Connection --> M2
    Dashboard_Connection --> M3
    Dashboard_Connection --> M4
    Dashboard_Connection --> M5
    Dashboard_Connection --> M6
    
    classDef primaryNode fill:#d0e0ff,stroke:#7B68EE,stroke-width:2px,color:#333;
    classDef stageNode fill:#f0f0ff,stroke:#8A80FF,stroke-width:1px,color:#333;
    classDef responseNode fill:#ffd0e0,stroke:#FF6B88,stroke-width:1px,color:#333;
    classDef taskNode fill:#d0ffe0,stroke:#4CAF50,stroke-width:1px,color:#333;
    classDef metricNode fill:#fff0d0,stroke:#FFA726,stroke-width:1px,color:#333;
    classDef connectionNode fill:#e0e0e0,stroke:#9E9E9E,stroke-width:1px,color:#333,stroke-dasharray: 5 5;
    
    class A,B,C,D primaryNode;
    class P1,P2,P3,P4,P5,P6,P7,P8,P9,P10,P11,P12,P13,P14 stageNode;
    class R1,R2,R3 responseNode;
    class T1,T2,T3,T4,T5,T6 taskNode;
    class M1,M2,M3,M4,M5,M6 metricNode;
    class Task_Connection,Dashboard_Connection connectionNode;
```

## Feature Requirements Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f0f0f0', 'primaryTextColor': '#323232', 'primaryBorderColor': '#7B68EE', 'lineColor': '#7B68EE', 'secondaryColor': '#e0e0e0', 'tertiaryColor': '#f9f9f9' }}}%%

flowchart LR
    subgraph "Feature Requirements"
        F1["Voice Quality<br/>(Realistic, GPT-powered)"]
        F2["Script Management"]
        F3["Customization Options"]
        F4["Control Parameters"]
    end
    
    F2 --> F2_1["Client provides script"]
    F2 --> F2_2["We give recommendations"]
    F2 --> F2_3["Client makes final decision"]
    
    F3 --> F3_1["Script is primary<br/>customizable element"]
    F3 --> F3_2["Fields like name<br/>and address"]
    
    F4 --> F4_1["Timing control"]
    F4 --> F4_2["Volume control"]
    
    classDef featureNode fill:#e6f7ff,stroke:#1890ff,stroke-width:2px,color:#333;
    classDef subfeatureNode fill:#f9f0ff,stroke:#722ed1,stroke-width:1px,color:#333;
    
    class F1,F2,F3,F4 featureNode;
    class F2_1,F2_2,F2_3,F3_1,F3_2,F4_1,F4_2 subfeatureNode;
```

## Usage Instructions

To view these diagrams:
1. Use a markdown viewer that supports mermaid syntax (like GitHub, GitLab, or VS Code with the appropriate extension)
2. The diagrams will render automatically in supported environments
3. For static viewing, you can paste the mermaid code into the [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor/) to generate an image

## Implementation Notes

- The purple diamonds in the original flowchart are represented as nodes with different colors and styles
- The flow maintains the same logical progression as the original diagram
- Stage automation is not visually distinguished in this diagram but is noted in the documentation 