import React, { useEffect, useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';
import ForceGraph3D from '3d-force-graph';
import { Play, Pause, Calendar, Search, X, Activity, Globe, Filter } from 'lucide-react';

// --- DATA & CONFIG ---
const ALLOWED_NAMES = new Set([
    "Tung", "Cong", "Anh", "Hang", "Trang", "Tinh",
    "Marc", "Rob", "Michelle", "Aiden", "Lauren",
    "Erik", "Ethan", "Bob", "Sam", "Svetlana"
]);

const CSV_CONTENT = `Date,Others,Tara BESS,BizDev & Carbon,GTB ,KBC Industrial,Hai Phong Green,CEBA Academy,REI & Peak,CPI ,DOS/NREL ,NIRAS/GEAPP,,,,,,,,,,,,
2025-12-29,"- 2025 reflect and planning for New Year \n- 4 days holidays ","- Review Ecoplexus report and model (all) \n- BESS case study on Canvas for Tara (Anh/Cong)",- Follow with VIOT on Amaccao and Verra posting (Tung/Hang),"- Update financed emission report with BIDV feedback (Hang/Trang))\n- Cont finalize reports for TCB (Hang/Trang/Anh)\n",,- Cont. pending further update from Loan after call (Hang/Tung),,,,,,,,,,,,,,,,,
2025-12-22,- Tinh discussion for early 2026,"- Final simulate Ecoplexus project using new model and test validity (Cong/Tung/Rob)\n- Share Ecoplexus report for internal review (Cong/Tung/Rob)\n- BESS case study on Canvas for Tara (Anh/Cong)","- Arrange meeting with Tara if possible (Tung)\n- Follow up with VIOT on Amaccao (Hang/Marc)\n- Follow up with Allcot (now Kcarbon X) on NDA (Hang/Tung)\n","- Cont.. finalize reports for BIDV (Hang/Tung/Anh)\n- Cont. summarize key changes for PCAF new versions (Hang/Trang/Tung)\n\n",- Finalize term sheet penalty and legal structure (Marc/Bob/Ethan),- Pending further update from Loan after call (Hang/Tung),,,,,,,,,,,,,,,,,
2025-12-15,- Leave plan for Xmas and New Year (all),"- Cont.. simulate Ecoplexus project using new model and test validity - private grid sale (Cong/Tung/Rob)\n- Final week before thesis submission (Tinh/all)\n- BESS case study on Canvas for Tara (Lauren/Anh/Cong)","- Share NDA with VinaCarbon (Tung/Lauren)\n- Follow up with VIOT on next steps (Hang/Marc)\n- Prep and summarize Tara meeting (Tung/all)\n- Finalize CPI Lab proposal (all)\n- Prep and summarize BII meeting (Tung/Cong)h","- Cont. finalize reports for BIDV and TCB (Hang/Tung/Anh)\n- Scope 3 nonfinance emission request (Hang/Tung)\n- Summarize key changes for PCAF new versions (Hang/Trang/Tung)\n",- Translate KBC slides + send back materials to BD team (Anh/Trang/Tung),- Cont.. update with DAE new contact and report progress with KBC (Tung/Hang),"- Finalize pitch deck and question list for consultation (Aiden/Michelle/Anh)\n- Send Corrina interview analysis by 18th Dec (Anh/Trang)\n- Prep and execute CEBA consultations (Anh/Aiden/Michelle)","- Update Tsheet & invoice (all)\n- Next steps with ENS (Rob/all)",,,,,,,,,,,,,,,
2025-12-08,- Hang & Trang domain presentation (Hang/Trang),"- Cont. simulate Ecoplexus project using new model and test validity - private grid sale (Cong/Tung/Rob)\n- Cont. Tinh final sprint on thesis (Tinh/all)\n- Presentation for Tara (Tung/Cong/Anh)\n- Cont. test fundamental validity of new Excel model (Rob/Tung/Cong)","- Support with Lab CPI proposal (Michelle/all)\n- Visit KBC HO and facilicate next steps (Marc/Hang/Anh/Trang)\n- Next steps with Amaccao, Idemitsu, Vinfast and Vinacarbon (Marc/Tung/Hang)\n- Schedule meeting with Yen before holiday (Tung/Hang/Anh)","- Review financed emission changes after PCAF update (Hang/Tung/Anh)\n- Finalize reports for BIDV and TCB (Hang/Tung/Anh)\n- Presentation for Tara (Tung/Hang)\n","- Review term sheet and connect with sales team for pipelining (Marc/all)\n",- Cont. update with DAE new contact and report progress with KBC (Tung/Hang),"- Review and finalize for Michelle (Tung)\n- Draft  and share visual presentation of cohort concept (Anh/Aiden/Michelle)\n- Outreach list, consultation questions (Anh/Aiden/Michelle)",- BESS system RFI (Anh/Cong/Rob),,,,,,,,,,,,,,,
2025-12-01,"- Trang out on Monday due to Influenza A\n- Update on Perplexity invoicing (Tung)\n- Marc visiting HCMC and HN this/next week (all)","- Share EYA results with Ecoplexus and Tara (Tung)\n- Simulate Ecoplexus project using new model and test validity - private grid sale (Cong/Tung/Rob)\n- Test fundamental validity of new Excel model (Rob/Tung/Cong)\n- Cont. draft outline for Ecplx reporting - PPT (Anh/Tung/Cong)\n- Tinh final sprint on thesis (all)b","- Marc visit in HCMC - Vinacarbon outreach, GreenCarbon, KBC (Tung/Cong/Hang)\n- Marc visit in Hanoi - Mr. Tho, WtE (Hang/Anh/Tung)\n- Finalize PUR carbon proposal dev (Marc/Aiden/Lauren)\n- Good Fashion Fund briefing and follow up (Michelle/all)\n- RFP for carbon project Sing-VN - email internal (Hang/Tung)\n","- PCAF coordination for next steps - time, letter, discount (Hang/Tung)\n- Finalize report for BIDV financed emission assessment (Hang/Anh/Tung)\n- Share recent reports internally with Michelle and Lauren for TCB/ BIDV (Hang/Tung)\n- Find and share corporate transition plan with Lauren and Michelle (Anh/Tung)\n- SLL coordination with BIDV for next steps (Anh/Tung)\n- Emission intensity database, financed emission to risk cal (Trang/Tinh/Tung)","- Lunch with KBC key contacts and align on final details (Marc/Cong/Tung)\n- Cont... build upon KBC IP & tenants database (Trang/Tinh/Tung)",- Update with DAE new contact and report progress with KBC (Tung/Hang),"- Draft visual presentation of cohort concept (Anh/Aiden/Michelle)\n- Begin outreach with selected brands and suppliers (Anh/Aiden/Michelle) - delay til 15th\n- Review TAM’s outline (Anh/all) - Dec 5th\n","- Next steps with ENS Foam (Rob/Anh)\n- Preparation for Oliver's trip? (Rob/all)\n- Update Tsheet (Tung/Cong/Trang)",,,,,,,,,,,,,,,
2025-11-24,"- Tung on leave Friday\n- Update legal register (Trang)","- Finalize and share EYA with Ecoplexus and Tara - parameters, Michelle inputs (Tung/Anh/Cong)\n- Note on EYA report = interim report/appendix (Tung/Michelle)\n- Update and customize model for 2-part tariff, utility solar and Ecoplexus (Cong/Tung/Rob)\n- Tinh thesis progress check-in (Tinh/Tung/Cong)","- Share C&I engagement options with Michelle for next step (Tung)\n- Standby for Seraphinn WtE (Hang/Tung)\n- IKI grant opportunity discussion (Hang/Michelle/Lauren)","- SLL confirmation (Lauren/Michelle/Anh)\n- Preparation for PCAF (Tung/Hang/Anh)\n- Finalize reports for BIDV non financed and financed emission (Hang/Trang/Tung)\n- Climate intel for 2026 - emission intensity database, financed emission to risk cal (Trang/Tinh/Tung)","- Plan meetings for Marc visit (Tung/Cong)\n- Cont.. build upon KBC IP & tenants database (Trang/Tinh/Tung)",- Final engage with DAE and report progress with KBC (Tung/Hang),"- Follow up Goertek with email (Cong/Anh)\n- Finalize timeline and list of questions for sharing (Anh/Aiden/Lauren)\n- Further outreach for 6 months interview (Anh/Trang)\n- SOW Q4: List of 8-10 brands/suppliers to conduct outreach (Anh)\n- Draft Concept Note and Pitch Deck (Anh/Aiden/Lauren)\n- Review TAM’s outline (Anh/all)","- Engage other vendors for ENS Foam - Stride, others (Anh/Rob)",,,,,,,,,,,,,,,
2025-11-17,baby shower when??? - :)) not soon,"- Cont. review EYA results, cover and provide feedback (Rob/Tung/Anh)\n- Finalize EYA cover page for internal review (Cong/Anh)\n- Update and customize model for utility solar and Ecoplexus (Cong/Tung/Rob)\n- Draft outline for Ecplx reporting - PPT (Anh/Tung/Cong)","- GAP proposal for VN and IN (Michelle/Rob/Tung)\n- Seraphinn WtE site visit prep - tentative (Hang/Tung)\n- PUR carbon proposal dev (Hang/Michelle/Aiden)","- BIDV & PCAF facilitation where required (Hang/Tung)\n- BIDV & SLL alignment on next steps & deliverables (Anh/Tung/Hang)\n- Draft reports progress for November deadline? (Hang/Tung/Anh)\n- Brainstorm and test emission intensity relevance to Vietnam economy - CEDA database (Hang/Trang/Tinh)","- Finalize thesis first draft for submission with supervisor (Tinh/Tung)\n- Cont. build upon KBC IP & tenants database (Trang/Tinh/Tung)\n- Cont.. modelling update for 2-part tariff opt (Tung/Rob/Cong)",- Cont... engage with DAE for official confirmation (Hang/Tung),"- CEBA new SOW discussion and planning - timeline to be shared with CEBA (all)\n- Share holidays in Jan and Feb 2026 with CEBA (Anh/Tung)\n- Create draft list of questions for engagement - flag overlap with 6-months (Anh/Michelle/Aiden/Lauren)\n- Interview request email (Anh/Trang)","- Reach out Coco, Vu Phong for Rob (Anh/Rob)\n- Cont.. coordinate with Jinquan for next steps - SmartSolar, JQ, REI (Anh/Cong)",,,,,,,,,,,,,,,
2025-11-10,"- Co-meeting space options (Trang/Hang)\n- Financed emission tool zfolio/Sweep/Others... (Hang/Trang)v","- Review EYA results and provide feedback (Rob/Tung/Anh)\n","- Prep for GENCO3 meeting? (Cong/Tung/Anh)\n- Internalize Seth's comments and follow up VIOT (Hang/Aiden/Tung)\n- Tinh progress on first draft and questions on data (Tinh/Tung/Cong)\n- First meeting for internal carbon team (Erik/Hang/Aiden)","- Response to BIDV feedback on report and tool (Hang/Trang/Anh)\n- Prepare for meeting with TCB for financed emission calculation tool on Tue (Hang/Trang/Anh)\n- Prepare for meeting with BIDV on emission and SLL (Hang/Anh/Tung)\n- Prepare for Scope 3 non financed calculation tool for BIDV (Hang/Trang/Anh)","- 3rd meeting on arrangement between AP and KBC (Marc/Ethan)\n- Build upon KBC IP & tenants database with further info on brands & RTS (Trang/Tinh/Tung)\n- Cont. modelling update for 2-part tariff opt (Tung/Rob/Cong)","- Cont.. engage with DAE for official confirmation (Hang/Tung)\n- Cont. brainstorm for in-person meeting/workshop KBC/Tara (Tung/Anh/all)","- Follow up with CEBA 6-month tasks (Anh/Trang) \n- Reach out to Tina-Luxshare (Trang/Anh)\n- Survey completion reminder email by 14th Nov (Anh/Trang)\n","- Rooftop solar companies list for ENS Foam (Anh/Cong/Rob)\n- Cont. coordinate with Jinquan for next steps - SmartSolar, JQ, REI (Anh/Cong)",,,,,,,,,,,,,,,
2025-11-03,"- 2026 workplan changes? (all)\n- Co-working space costly (Trang/Hang)","- Finalize Emivest Slides (Trang/Cong/Tung)\n- Share Emivest report and engage Tara/Nami for update (Tung/Cong/Anh)\n- Plan project layout, initial steps and estimate timeline for Ecplx modelling - Autocad, pvsyst (Cong/Tung/Tinh)","- Next steps for carbon opps - WtE, Terviva, BPP, PUR (Tung/Hang)\n- Cont. Hai Ha IP and mill factories desk research for Gap Inc (Trang/Anh/Tung)\n- Tinh progress on literature review and methodology before first submission (Tinh/Tung)","- Rework monthly sheet (Tung)\n- Cont. data collection with BIDV for November reporting (Hang/Tung/Anh)\n- Update and engage TCB with revised tool (Hang/Trang/Anh)\n- Draft and engage BIDV with new SLL ideas (Anh/Tung)\n","- Add brands details where possible to IP list (Trang/Tinh/Tung)\n- Wait for further update from Marc and Alan on Singapore entity (all)\n- Modelling update for 2-part tariff opt (Tung/Rob/Cong)","- Cont. engage with DAE for official confirmation (Hang/Tung)\n- Brainstorm for in-person meeting/workshop KBC/Tara (Tung/Anh/all)","- Submit online academy translation validation (Anh/Cong/Hang)\n- Check proposal and finalize monthly sheet (Anh/Tung)","- Coordinate with Jinquan for next steps - SmartSolar, JQ, REI (Anh/Cong)",,,,,,,,,,,,,,,
2025-10-27,"- Legal register update - DPPA draft, BESS (Trang)\n- Trang side project (Trang/Tung)","- Update and share final analysis and reporting for Emivest for internal review (Cong/Tung/Anh)\n- Engage Ecplx for data collection and modelling feedback - delay & timing (Tung/Cong)\n- Nami & Emivest engagement on updated modelling (Cong/Tung/Michelle)\n- Brainstorm for in-person meeting/workshop (Tung/Anh/all)\n- Emivest Slides (Trang/Cong/Tung)","- Hai Ha IP and mill factories desk research for Gap Inc - check data (Trang/Anh/Tung)\n- Prep for Terviva engagement on pongamia (Tung/Hang)\n- PUR cocoa carbon project discussion (Tung/Hang)","- Cont. TCB tool and data review for next steps (Tung/Hang/Trang/Anh)\n- Cont. prelim brief to pivot SLL workplan using market reference from other countries/regions (Anh/Tung)\n- Resume data collection with BIDV for November reporting (Hang/Tung/Anh)\n","- Modelling update for implication of 2-part tariff on solar+storage optimization (Cong/Tung)\n- Cont. review IP portfolio under KBC and data extraction (Trang/Anh/Tinh)\n- Brainstorm and draft joint venture agreement with KBC (Marc/Michelle/Rob/all)\n","- Update monthly workplan sheet using new proposal (Hang/Trang/Tung)\n- Cont engage with DAE with revised proposal and MOU (Hang/Tung)","- Review new SOW and draft proposal for CEBA (Michelle/Anh/Hang/Trang)\n- Online Academy translation validation (Anh/Trang/Tinh)\n- Review thesis workplan and draft presentation (Tinh/Tung)","- Review offers from CocoSolar and Entoria (Cong/Anh)\n- Engage Viettel Construction introduced by Hue REI (Trang/Anh)\n- Coordinate with Jinquan for next steps (Anh/Cong)",,,,,,,,,,,,,,,
2025-10-20,"- Carbon market training (Anh/Hang/Trang)\n- CFE 24/7 SG workshop (Erik)\n- Pickleball idea - frisbee ","- Review data request for modelling and send Ecplx (Tung/Cong/Rob)\n- Improve modelling, reporting and analysis for Emivest (Cong/Tung/Rob/Anh)\n- Start early work on Ecplx modelling and reporting (Cong/Anh/Tung)\n","- Terviva prep (Tung)\n- GAP call \n- Next steps with Amaccao/Seraphinn - site visit and data request (Tung/Hang)\n- Cont. carbon project document RAG/wrapper approach (Tinh/Aiden/Hang)\n","- Prelim brief to pivot SLL workplan using market reference from other countries/regions (Anh/Tung)\n- TCB tool and data review for next steps (Tung/Hang/Trang/Anh)\n","- Cont. Tinh weekly workplan for FMP thesis (Tinh/Tung)\n- Review IP portfolio under KBC and recommend top 3-4 IPs or tenants for further engagement and data request (Trang/Cong/Rob/Michelle)\n- IP Data Extraction (Trang/Anh)\n","- Confirm next steps with KBC - Aus visit, MOU (Tung/Hang)\n- Engage with DAE with revised proposal and official dispatch (Hang/Tung)\n- Hai Phong Leaders' work schedule when training abroad","- Support Corrina with 6-months check in (Anh/Trang/Tung)\n- Further support for online Academy this week (Anh/Trang/Tinh) ","- Share i-RECs service or vendor list with Hue REI (Anh/Trang/Hang/Lauren)\n- Resolve questions/ideas from George Jinquan (Cong/Rob/Tung)\n- Follow up with CocoSolar and Entoria (Trang/Anh/Cong)",,,,,,,,,,,,,,,
2025-10-13,"- EAVCED training DPPA (5&6/11) (Trang/Cong/Tung)\n- DFAT workshop\n- HN 7th November (Tung)\n","- Review draft report for Emivest (Cong/Tung/Rob/Anh)\n- Reconnect with Ecoplexus for meeting arrangement (Tung)\n- Request Ecplx data for modelling (Cong/Tung)\n","- Amazon Device energy audit request discussion - outsource staff, personnel cert - MOIT (all)\n- Seraphinn/Amaccao meeting (Hang/Aiden/Tung)\n- GAP proposal (Michelle/Cong/Rob/Tung)\n- Cont. carbon project document RAG/wrapper approach (Tinh/Aiden/Hang)","- Review updated tool for further sharing (Tung/Hang)\n- Resume data collection and review for upcoming draft GHG assessment report (Hang/Trang/Anh)\n- Brainstorm ideas to pivot SLL workplan using market reference from other countries/regions (Anh/Tung)","- Complete pitchdeck and share with KBC (Marc/Rob/Cong/Michelle)\n- Tinh weekly workplan for FMP thesis (Tinh/Tung)\n","- Finalize ENG and VIE proposal for sharing with KBC (Michelle/Marc/Hang/Trang)\n- Draft MOU for Hai Phong based on proposal (Hang/Trang)\n- Follow up with KBC and Saigontel on next steps (Tung/Hang)\n","- Support with translation (Anh/Trang)\n- Support with 6-month process (Anh/Trang)\n- Review future retail tariff brief and 2-part pricing structure (Tung/Trang/Cong) ","- REI request for i-RECs service or vendor list (Anh/Trang/Lauren)\n- Coordinate next steps with Jinquan and others (Anh/Cong/Trang)",,,,,,,,,,,,,,,
2025-10-06,"- BKK update\n- Coworking space (Trang/Tung)\n- DFAT carbon presentation (Hang/Lauren/Tung)","- Cont. draft report for Emivest (Anh/Cong/Tung)\n- Cont. engage Ecoplexus for project data and feedback (Tung/Cong)\n- FMP thesis update and review (Tinh/Tung/Cong/Rob)\n- Introduce STB Giga to PHL team (Cong)","- Discuss internally on WtE Doxaco and possibly Seraphinn project (Hang/Marc/Aiden)\n- Carbon project document RAG/wrapper approach (Tinh/Aiden/Hang)\n","- Revise and update financed emission tool with BIDV feedback (Trang/Hang)\n","- KBC pitch deck near completion - stats, graphs, visual (Michelle/Cong/Rob/Tung/Marc)","- Finalize proposal for internal sharing -  language, carbon, Tara, Josh (Tung/Hang/Marc)\n",- 6-month follow up,"- Summarize meeting outcomes for REI and others (Anh/Cong/Trang)\n- Review and discuss new offer from SmartSolar (Cong/Anh/Tung/Rob)\n",,,,,,,,,,,,,,,
2025-09-29,"- BPP Showcase in CanTho\n","- Progress update presentation for Tara (Anh/Cong/Trang)\n- Draft report for Emivest (Anh/Cong/Tung)\n- FMP thesis update and review (Tinh/Tung/Cong/Rob)\n- Discuss BESS model with Ecoplexus and test project data (Cong/Tung/Anh)\n","- KBC pitch deck sharing - IP landscape; KBC opportunity (Cong/Aiden/Rob/Marc)\n- VIOT WtE project survey (Hang/Tung/Aiden)\n","- Progress update presentation for Tara (Hang/Anh/Trang)\n- Discuss request from BIDV - call Linh (Hang/Tung/others)\n- Finalize and submit Scope 1& 2 report for BIDV (Hang/Tung/Anh)",,"- Next steps with Hai Phong, DAE and KBC (Hang/Marc/Tung/KBC)\n","- Share photos and materials with brand reps - Nike, lululemon, REI (Anh/Trang)\n- [delayed] Digital Content Translation Review (Anh/Trang/Tinh)\n- Draft future retail electricity price (Trang/Tinh)",- Support meeting between Jinquan and SmartSolar (Cong/Anh/Trang),"- Review sensitive content for public version (Anh/Trang/Tung)\n- Share public version (Anh/Trang/Tung)",,,,,,,,,,,,,,
2025-09-22,"- Tara catch up timing (Tung)\n- KBC Data Center POC follow up (Tung)\n- Tung on leave Wed, Fri","- Select one btm site for reporting (Cong/Tung/Anh)\n- Connect with Hien and Ecoplexus technical team in Turkey for BESS model feedback (Cong/Tung/Rob)","- UNDP proposal follow up (Tung/Michelle/Lauren)\n- KBC pitch deck finalizing - IP landscape; KBC opportunity (Cong/Aiden/Rob/Marc)\n- WtE carbon and data request form follow up (Marc/Hang/Aiden)\n- Retail price, FMP, RAG & supply chain data projects (Tinh/Trang/Aiden)","- Follow up with BIDV on training date (Hang/Tung/Anh)\n",,"- Follow up with DAE and Mr Duong for next step with Hai Phong (Hang/Tung)\n","-Linkedin post (Anh/Lauren) \n-CEBA post-event emails: facilitators-speakers-participants","- Review offer from SmartSolar (Cong/Rob/Anh)\n","- Slide for Bangkok Climate Week (Anh/Trang/Tung)\n- Review sensitive content for public version (Anh/Trang/Tung)",,,,,,,,,,,,,,
2025-09-15,"- Retail price, FMP, RAG & supply chain data projects (Tinh/Trang/Aiden)","- Check in with Ecoplexus on model feedback (Cong/Tung)\n- Translate and review Vinergo model (Trang/Cong/Rob)","- Quick note/email recap GEAPP event and share materials (Cong/Anh)\n- Big picture KBC pitch deck drafting (all)\n","- Follow up with BIDV on financed emission calculations (Hang/Trang/Tung)\n",,- Follow up with KBC on update for Hai Phong (Tung) ,"- Print with VAT (Trang/Tung)\n- Finalize logistics - ? (Anh/Trang)\n- Finalize content and translation (Anh/all)\n- Prep for video interview ",- Update Tsheets with recent hours for REI (Cong/Anh),,,,,,,,,,,,,,,
2025-09-08,"- Marketing slidedeck input (Trang/Hang)\n","- Check in with Ecoplexus on model feedback (Cong/Tung)\n","- Brainstorm industrial park project (Marc/Cong/Tung)\n- KBC DC deck sharing (Tung)\n- Follow up lululemon if no response (Tung)\n- Gather BESS insights during GEAPP event (Cong/Anh)","- Share the Scope 1&2 tool (instruction and survey form) to TCB (Hang/Tung/Trang)\n- Share financed emission tool with BIDV (Hang/Tung/others)\n- Prepare for BIDV financed emission tool (Tinh/Trang/Hang)",,- Follow up with KBC on update for Hai Phong (Tung) ,"- Send confirmation email (Trang/Anh)\n- Finalize slides - external, DPPA (Anh/Tung/Aiden/Cong)\n- Start slide translations (Anh/Trang/Tinh)\n- Logistics final - coordinators, tables, Slido, printing (Trang/Anh/Hang/others)","- Faciliate call and site visit for Jinquan (Trang/Anh/Cong)\n- Review offer from SmartSolar (Cong/Rob/Anh/Tung)\n- Share ENS Solution results (Aiden/Trang/Rob)",- Final update for report (Anh/Trang),,,,,,,,,,,,,,`;

// Color Palette
const COLORS = [
    "#FF007A", "#00FFFF", "#FFD700", "#FF4500", "#7FFF00",
    "#00BFFF", "#9932CC", "#FF1493", "#00FA9A", "#FF6347",
    "#1E90FF", "#DA70D6", "#FFFF00", "#00FF7F", "#FF69B4"
];

const getNodeColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
};

export default function App() {
    const graphRef = useRef<HTMLDivElement>(null);
    const graphInstance = useRef<any>(null);

    // Data State
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [uniqueDates, setUniqueDates] = useState<string[]>([]);

    // Control State
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{ id: string, tasks: string[], date: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

    const [stats, setStats] = useState({ nodes: 0, links: 0 });

    // --- PARSING ---
    useEffect(() => {
        const results = Papa.parse(CSV_CONTENT, {
            header: true,
            skipEmptyLines: true
        });

        const timeData: any[] = [];
        const dates = new Set<string>();

        results.data.forEach((row: any) => {
            const date = row['Date'];
            if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) return;
            dates.add(date);

            const dailyConnections: any[] = [];
            const dailyTasks: Record<string, string[]> = {};

            Object.keys(row).forEach(key => {
                if (key === 'Date') return;
                const cellContent = row[key];
                if (!cellContent) return;

                const regex = /\(([^)]+)\)/g;
                let match;
                const namesInTask = new Set<string>();

                while ((match = regex.exec(cellContent)) !== null) {
                    match[1].split(/[\/,&]/).forEach(n => {
                        const cleanName = n.trim();
                        if (ALLOWED_NAMES.has(cleanName)) {
                            namesInTask.add(cleanName);
                            if (!dailyTasks[cleanName]) dailyTasks[cleanName] = [];
                            dailyTasks[cleanName].push(cellContent);
                        }
                    });
                }

                const namesArray = Array.from(namesInTask);
                if (namesArray.length > 1) {
                    for (let i = 0; i < namesArray.length; i++) {
                        for (let j = i + 1; j < namesArray.length; j++) {
                            const pair = [namesArray[i], namesArray[j]].sort();
                            dailyConnections.push(pair);
                        }
                    }
                }
            });

            timeData.push({
                date,
                connections: dailyConnections,
                tasks: dailyTasks
            });
        });

        timeData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setParsedData(timeData);
        setUniqueDates(timeData.map(d => d.date));
    }, []);

    // --- GRAPH DATA CALC ---
    const graphData = useMemo(() => {
        if (!parsedData.length) return { nodes: [], links: [] };

        // 1. Time Filtering (Sliding Window: Show specific week only? Or Cumulative?)
        // User asked for "filter data... active during that time window". 
        // Let's make it Cumulative up to that point to keep the network growing, 
        // BUT highlight/filter based on selection.
        // Actually, "Active during that time window" often implies a snapshot.
        // Let's stick to the previous cumulative logic but FILTER the result based on staff.

        const limitIndex = currentDateIndex;
        const nodesMap = new Map<string, number>();
        const linksMap = new Map<string, number>();

        // We accumulate data up to the current date
        for (let i = 0; i <= limitIndex; i++) {
            const dayData = parsedData[i];
            dayData.connections.forEach((pair: string[]) => {
                const [source, target] = pair;
                nodesMap.set(source, (nodesMap.get(source) || 0) + 1);
                nodesMap.set(target, (nodesMap.get(target) || 0) + 1);

                const linkId = `${source}-${target}`;
                linksMap.set(linkId, (linksMap.get(linkId) || 0) + 1);
            });
        }

        let nodes = Array.from(nodesMap.entries()).map(([id, val]) => ({ id, val }));
        let links = Array.from(linksMap.entries()).map(([key, weight]) => {
            const [source, target] = key.split('-');
            return { source, target, weight };
        });

        // 2. Staff Filtering
        if (selectedStaff.length > 0) {
            // Filter nodes: Only selected staff OR staff connected to them?
            // "Display only those nodes" -> strict filter + their history.
            nodes = nodes.filter(n => selectedStaff.includes(n.id));

            // Filter connections: Only if BOTH are in selected staff? 
            // Or if ONE is in selected staff? usually "Both" for strict, "One" for egocentric.
            // Let's go strict for "Display only those nodes".
            links = links.filter(l => selectedStaff.includes(l.source) && selectedStaff.includes(l.target));
        }

        return { nodes, links };
    }, [parsedData, currentDateIndex, selectedStaff]);

    useEffect(() => {
        setStats({ nodes: graphData.nodes.length, links: graphData.links.length });
        if (graphInstance.current) {
            graphInstance.current.graphData(graphData);
        }
    }, [graphData]);

    // --- INIT GRAPH ---
    useEffect(() => {
        if (!graphRef.current) return;

        const myGraph = (ForceGraph3D as any)()(graphRef.current);
        graphInstance.current = myGraph;

        myGraph
            .backgroundColor('#050a08')
            .nodeLabel('id')
            .nodeColor((node: any) => getNodeColor(node.id)) // Dynamic Color
            .nodeVal((node: any) => Math.sqrt(node.val) * 2)
            .nodeResolution(16)
            .nodeOpacity(1)
            .linkLabel(link => `Strength: ${link.weight}`)
            .linkColor(() => 'rgba(255, 255, 255, 0.2)')
            .linkWidth((link: any) => Math.sqrt(link.weight) * 0.5)
            .linkDirectionalParticles(2)
            .linkDirectionalParticleSpeed((d: any) => d.weight * 0.002)
            .onNodeClick((node: any) => {
                const tasks: string[] = [];
                for (let i = 0; i <= currentDateIndex; i++) {
                    const dayTasks = parsedData[i]?.tasks[node.id];
                    if (dayTasks) tasks.push(...dayTasks);
                }
                const uniqueTasks = Array.from(new Set(tasks));

                setSelectedNode({
                    id: node.id,
                    tasks: uniqueTasks,
                    date: uniqueDates[currentDateIndex]
                });
            });

        return () => {
            if (graphRef.current) graphRef.current.innerHTML = '';
        };
    }, []);

    // --- RESIZE ---
    useEffect(() => {
        const handleResize = () => {
            if (graphInstance.current) {
                graphInstance.current
                    .width(window.innerWidth)
                    .height(window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- PLAY LOOP ---
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentDateIndex(prev => {
                    const next = prev + 1;
                    if (next >= uniqueDates.length) return 0;
                    return next;
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isPlaying, uniqueDates]);

    const currentDate = uniqueDates[currentDateIndex] || 'Loading...';

    // --- HELPERS ---
    const toggleStaffSelection = (name: string) => {
        setSelectedStaff(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const filteredNames = Array.from(ALLOWED_NAMES).filter(n =>
        n.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-[#0df280] selection:text-black">

            {/* 3D Container */}
            <div ref={graphRef} className="absolute inset-0 z-0" />

            {/* HEADER & FILTER */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 max-h-[80vh]">
                {/* Title Card */}
                <div className="glass-panel p-5 rounded-2xl w-80 md:w-96">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#0df280] w-6 h-6" />
                            <div>
                                <h1 className="text-lg font-bold tracking-wider">Neural<span className="text-[#0df280]">Sync</span></h1>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Network HUD</p>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#0df280] animate-pulse"></div>
                    </div>
                </div>

                {/* Search / Filter */}
                <div className="glass-panel p-4 rounded-2xl w-80 md:w-96">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter Staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#0df280] transition-colors"
                        />
                    </div>

                    <div className="mb-2 flex flex-wrap gap-2">
                        {selectedStaff.map(name => (
                            <button
                                key={name}
                                onClick={() => toggleStaffSelection(name)}
                                className="flex items-center gap-1 text-[10px] bg-[#0df280] text-black px-2 py-1 rounded-full font-bold hover:bg-white transition-colors"
                            >
                                {name} <X className="w-3 h-3" />
                            </button>
                        ))}
                        {selectedStaff.length > 0 && (
                            <button onClick={() => setSelectedStaff([])} className="text-[10px] text-gray-400 hover:text-white underline p-1">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {filteredNames.map(name => (
                            <button
                                key={name}
                                onClick={() => toggleStaffSelection(name)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedStaff.includes(name) ? 'bg-white/10 text-[#0df280]' : 'text-gray-300'}`}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(name) }}></span>
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM TIMELINE */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-10">
                <div className="glass-panel rounded-full px-6 py-4 flex items-center gap-6">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-black' : 'bg-[#0df280] text-black hover:scale-110'}`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</span>
                            <span className="text-sm font-mono font-bold text-[#0df280]">{currentDate}</span>
                        </div>

                        <div className="relative h-6 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max={uniqueDates.length - 1 || 0}
                                value={currentDateIndex}
                                onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #0df280 0%, #0df280 ${(currentDateIndex / (uniqueDates.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(currentDateIndex / (uniqueDates.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILS PANEL */}
            {selectedNode && (
                <div className="absolute top-0 right-0 h-full w-full md:w-[400px] z-20 glass-panel border-l border-white/10 animate-slide-in flex flex-col">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <p className="text-xs text-[#0df280] uppercase tracking-widest mb-1">Personnel Record</p>
                            <h2 className="text-3xl font-bold font-mono" style={{ color: getNodeColor(selectedNode.id) }}>{selectedNode.id}</h2>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#0df280]" />
                                Validated Skills / Tasks
                            </h3>
                            <div className="space-y-3">
                                {selectedNode.tasks.map((task, idx) => (
                                    <div key={idx} className="p-3 bg-white/5 rounded border border-white/5 hover:border-[#0df280]/30 transition-colors group">
                                        <p className="text-xs leading-relaxed text-gray-300 group-hover:text-white transition-colors">
                                            {task.replace(/- /g, '').trim()}
                                        </p>
                                    </div>
                                ))}
                                {selectedNode.tasks.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No specific task descriptions logged.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Global styles for slider track
const style = document.createElement('style');
style.innerHTML = `
  input[type=range]::-webkit-slider-thumb {
    box-shadow: 0 0 15px #0df280;
    transition: transform 0.1s;
  }
  input[type=range]:active::-webkit-slider-thumb {
    transform: scale(1.3);
  }
`;
document.head.appendChild(style);
