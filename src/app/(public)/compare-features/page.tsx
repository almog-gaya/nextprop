'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';


export default function CompareFeaturesPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);


  const handleCompareFeaturesClick = () => {

  };

  const handlePlansAndPricingClick = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden" style={{ backgroundImage: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)' }}>
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="text-center mx-auto">
          <p style={{ fontSize: '54px', fontWeight: 900, color: 'black' }}>Pricing Plans</p>
          <p style={{ fontSize: '18px', fontWeight: 500, color: '#59595C' }}>
            Nextprop handles it all—no extra tools required.
            <br />
            All plans include Live Zoom, Live Chat, Phone & SMS support.
          </p>
          {/* Added buttons container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
            {/* Button group */}
            <div className="flex items-center gap-4" style={{ padding: '10px' }}>
              <button
                className="text-sm font-semibold"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'black',
                  padding: '7px 21px',
                  borderRadius: '10px',
                  border: '1px solid #D1D1D1',
                }}
                onClick={handlePlansAndPricingClick}
              >
                Plans & Pricing
              </button>
              <button
                className="text-sm font-semibold"
                style={{
                  backgroundColor: '#9C03FF',
                  color: 'white',
                  padding: '7px 21px',
                  borderRadius: '10px',
                  border: '1px solid #D1D1D1',
                }}
                onClick={handleCompareFeaturesClick}
              >
                Compare Features
              </button>
            </div>

          </div>
        </div>
        <div className="w-full flex justify-center lg:justify-end mt-8 mb-4 px-4 lg:px-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'black' }}>Save up to 29%</span>
            <span style={{ color: '#9C03FF' }}>Yearly</span>
            {/* Basic switch placeholder */}
            <div className="w-10 h-6 bg-purple-600 rounded-full flex items-center p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
            </div>
            <span style={{ color: '#59595C' }}>Monthly</span>
          </div>
        </div>


        {/* Trial and Features and Plans Container */}
        <div className="pt-8 flex ">
          <div className="text-[16.73px]  text-[#8a2be2]  border-r border-white/30 font-[600px] space-y-2"
            style={{
              width: '444px',
              height: '148px',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'start',
              paddingTop: '22px',
              paddingBottom: '22px'

            }}>
            <p>30 DAY FREE TRIAL</p>
            <p>UNLIMITED ONBOARDINGS</p>
            <p>FREE COURSES</p>
          </div>

          <div className="flex flex-col md:flex-row ">
            {[
              {
                title: "BASIC",
                price: "$149",
                btnColor: "bg-black text-white",
                tag: null,
              },
              {
                title: "PRO",
                price: "$299",
                btnColor: "bg-[#4f46e5] text-white",
                tag: "Recommended",
              },
              {
                title: "ENTERPRISE",
                price: "$599",
                btnColor: "bg-black text-white",
                tag: "Most Value",
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className="relative  border-r border-white/30  text-center text-black"
                style={{ width: '291px', height: '148px' }}
              >
                <div className="text-[#8a2be2] font-semibold text-sm mb-2">{plan.title}</div>

                {plan.tag && (
                  <div
                    className={`absolute -top-0 right-3 text-xs px-2 py-1 ${plan.tag === "Recommended" ? "bg-[#4f46e5] text-white" : "bg-black text-white"}`}
                    style={{ borderTopLeftRadius: '13px', borderTopRightRadius: '13px', borderBottomRightRadius: '13px', borderBottomLeftRadius: 0 }}
                  >
                    {plan.tag}
                  </div>
                )}

                <div style={{ fontSize: '33px', fontWeight: 600, }}>{plan.price}</div>
                <Button
                  className={` rounded-xl  mb-2 ${plan.btnColor}`}
                  style={{ fontSize: '12px', fontWeight: 600, width: '231px', height: '39px' }}
                >
                  Start Your 30 Day Free Trial
                </Button>
                <p className="text-xs text-gray-800" >
                  Fast and Free Setup. Cancel Anytime.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="w-full  mt-8 ">
          <table className="  divide-y divide-gray-200">

            <tbody className=" divide-y divide-gray-200">
              {/* Users Row */}
              <tr>
                <td className="text-sm font-medium text-gray-900 border"
                  style={{
                    width: '374px',
                    height: '50px',
                    textAlign: 'start',
                  }}>Users</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border"
                  style={{
                    width: '291px',
                    height: '50px',
                  }}>1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>15</td>
              </tr>
              {/* Phone Numbers Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border"
                  style={{
                    width: '374px',
                    height: '50px',
                    textAlign: 'start',
                  }}>Phone Numbers</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>15</td>
              </tr>
              {/* Table rows will be added here based on subsequent images */}
            </tbody>
          </table>
        </div>

        {/* Feature Comparison Table (Collapsible) */}
        <FeatureComparisonTable />
      </div>
    </div >
  );
}

// Collapsible feature comparison table component
function FeatureComparisonTable() {
  type Section = 'data' | 'marketing' | 'sales' | 'operations' | 'addon' | 'additionalUsage';
  const [openSections, setOpenSections] = React.useState<Record<Section, boolean>>({
    data: true,
    marketing: true,
    sales: true,
    operations: true,
    addon: true,
    additionalUsage: true,
  });

  const toggleSection = (section: Section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // SVG for purple checkmark
  const PurpleCheck = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <path d="M5 10.5L9 14.5L15 7.5" stroke="#9C03FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  // SVG for info icon
  const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#59595C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle', opacity: 0.7 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );

  // Table data for each section
  const dataFeatures = [
    { label: 'List Stacking', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'List Pulling (coming soon)', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Driving for Dollars', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Free Monthly Cash Buyer Searches', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Free Monthly Skip Tracing Credits', basic: 'x', pro: 'x', enterprise: 'x' },
  ];
  const marketingFeatures = [
    { label: 'SEO optimized Seller Website', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'SEO Optimized Buyer Website', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Drip Campaigns', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Direct Mail', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Drip Automation', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Bulk Email & SMS to Buyers', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Email Tracking', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Gmail Integration', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
  ];
  const salesFeatures = [
    { label: 'e-Sign', basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Disposition Wholesale Pipeline', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Speed to Lead', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'In-App Answering', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Agent Whisper', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Agent Monitoring', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Call Barge', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
  ];
  const operationsFeatures = [
    { label: 'KPI Dashboards', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Leaderboard', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Full Accounting System', info: true, basic: 'check', pro: 'check', enterprise: 'check' },
    { label: 'Daily Productivity Email', info: true, basic: '', pro: 'check', enterprise: 'check' },
    { label: '2-way Google Calendar Integration', info: true, basic: '', pro: 'check', enterprise: 'check' },
    { label: 'Dedicated Account Manager', info: true, basic: '', pro: '', enterprise: 'check' },
  ];
  const addonFeatures = [
    { label: 'In-App Answering (Web, iOS and Android)', info: true, basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Markets', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Buyers & Vendors', info: true, basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'File Storage', info: true, basic: 'x', pro: 'x', enterprise: 'x' },
  ];
  const additionalUsageFeatures = [
    { label: 'Additional User', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Additional Cash Buyer Searches', info: true, basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Phone Number', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Calling Minutes', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'SMS', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'e-Sign', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Bulk Email(per 1,000 emails)', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Additional Website', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Unlimited List Stacking Rec.', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Additional 50 GB Storage', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'RVM', basic: 'x', pro: 'x', enterprise: 'x' },
    { label: 'Skip Tracing', basic: 'x', pro: 'x', enterprise: 'x' },
  ];

  // Table column widths (match pricing table)
  const colWidths = [
    { width: '374px' },
    { width: '291px' },
    { width: '291px' },
    { width: '291px' },
  ];

  // Helper to render cell content
  const renderCell = (val: string) => {
    if (val === 'x') return <span className="text-black">x</span>;
    if (val === 'check') return <PurpleCheck />;
    return null;
  };

  // Helper to render label with info icon
  const renderLabel = (row: any) => (
    <span>
      {row.label}
      {row.info && <InfoIcon />}
    </span>
  );

  return (
    <div className="w-full mt-8" style={{ background: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)', borderRadius: '8px' }}>
      {/* Data Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('data')}
        >
          <span className="font-bold text-lg">Data</span>
          <span>{openSections.data ? '▾' : '▸'}</span>
        </div>
        {openSections.data && (
          <table className="w-full">
            <tbody>
              {dataFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{row.label}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Marketing Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('marketing')}
        >
          <span className="font-bold text-lg">Marketing</span>
          <span>{openSections.marketing ? '▾' : '▸'}</span>
        </div>
        {openSections.marketing && (
          <table className="w-full">
            <tbody>
              {marketingFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{renderLabel(row)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Sales Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('sales')}
        >
          <span className="font-bold text-lg">Sales</span>
          <span>{openSections.sales ? '▾' : '▸'}</span>
        </div>
        {openSections.sales && (
          <table className="w-full">
            <tbody>
              {salesFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{renderLabel(row)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Operations Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('operations')}
        >
          <span className="font-bold text-lg">Operations</span>
          <span>{openSections.operations ? '▾' : '▸'}</span>
        </div>
        {openSections.operations && (
          <table className="w-full">
            <tbody>
              {operationsFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{renderLabel(row)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Add-on Features Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('addon')}
        >
          <span className="font-bold text-lg">Add-on Features</span>
          <span>{openSections.addon ? '▾' : '▸'}</span>
        </div>
        {openSections.addon && (
          <table className="w-full">
            <tbody>
              {addonFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{renderLabel(row)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Additional Usage Section */}
      <div>
        <div
          className="flex items-center justify-between px-2 py-2 bg-white border-b cursor-pointer"
          onClick={() => toggleSection('additionalUsage')}
        >
          <span className="font-bold text-lg">Additional Usage</span>
          <span>{openSections.additionalUsage ? '▾' : '▸'}</span>
        </div>
        {openSections.additionalUsage && (
          <table className="w-full">
            <tbody>
              {additionalUsageFeatures.map((row, idx) => (
                <tr key={row.label} style={{ background: idx % 2 === 0 ? 'rgba(156,3,255,0.08)' : 'rgba(156,3,255,0.13)' }}>
                  <td className="text-left px-4 py-3 font-medium text-black border" style={colWidths[0]}>{renderLabel(row)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[1]}>{renderCell(row.basic)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[2]}>{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3 border" style={colWidths[3]}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
