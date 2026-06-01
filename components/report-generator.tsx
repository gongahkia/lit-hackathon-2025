// "use client";

// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Loader2, FileText, DownloadCloud, CheckCircle, FileWarning, ShieldCheck, RefreshCcw } from "lucide-react";

// const REPORT_TRIGGER_URL = "http://localhost:5011/generate-report";
// const REPORT_DOWNLOAD_URL = "http://localhost:5011/download/report";

// export function GenerateReport() {
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isGenerated, setIsGenerated] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
//   const [generationTime, setGenerationTime] = useState<string | null>(null);

//   async function checkReport() {
//     setError(null);
//     setIsGenerating(true);
//     console.log("[GenerateReport] Checking existing report availability...");

//     try {
//       const res = await fetch(REPORT_DOWNLOAD_URL, { method: "HEAD" });
//       console.log(`[GenerateReport] HEAD ${REPORT_DOWNLOAD_URL} responded with status: ${res.status}`);

//       if (res.ok) {
//         setDownloadUrl(REPORT_DOWNLOAD_URL);
//         setIsGenerated(true);

//         const lastModified = res.headers.get("Last-Modified");
//         if (lastModified) {
//           setGenerationTime(lastModified);
//           console.log(`[GenerateReport] Report last modified at: ${lastModified}`);
//         } else {
//           console.log("[GenerateReport] No Last-Modified header found.");
//         }
//       } else {
//         console.warn(`[GenerateReport] Report not found or not accessible (status ${res.status}).`);
//         setIsGenerated(false);
//         setDownloadUrl(null);
//       }
//     } catch (e) {
//       console.error("[GenerateReport] Error checking report availability:", e);
//       setIsGenerated(false);
//       setDownloadUrl(null);
//       setError("Unable to check report availability. Is the backend running?");
//     } finally {
//       setIsGenerating(false);
//     }
//   }

//   async function handleGenerateReport() {
//     setIsGenerating(true);
//     setError(null);
//     setIsGenerated(false);
//     setDownloadUrl(null);
//     setGenerationTime(null);

//     console.log("[GenerateReport] Triggering report generation...");

//     try {
//       const res = await fetch(REPORT_TRIGGER_URL, { method: "POST" });
//       console.log(`[GenerateReport] POST ${REPORT_TRIGGER_URL} responded with status: ${res.status}`);

//       if (!res.ok) {
//         const text = await res.text();
//         console.error(`[GenerateReport] Backend error response: ${text}`);
//         setError(text || "Failed to generate. Please check backend/logs.");
//         setIsGenerating(false);
//         return;
//       }

//       // Try parse JSON for more info
//       let data;
//       try {
//         data = await res.json();
//         console.log("[GenerateReport] Backend response data:", data);
//       } catch (jsonErr) {
//         console.warn("[GenerateReport] Failed to parse JSON from backend response:", jsonErr);
//         const text = await res.text();
//         setError(text || "Failed to parse backend response.");
//         setIsGenerating(false);
//         return;
//       }

//       if (data && data.success) {
//         setIsGenerated(true);
//         setError(null);
//         // Set download link and check report meta
//         setDownloadUrl(REPORT_DOWNLOAD_URL);
//         checkReport();
//       } else {
//         const msg = data?.error || "Unknown server error.";
//         console.error(`[GenerateReport] Backend returned error: ${msg}`);
//         setError(msg);
//       }
//     } catch (e) {
//       console.error("[GenerateReport] Fetch error during report generation:", e);
//       setError((e as Error).message || "Unknown error occurred.");
//     } finally {
//       setIsGenerating(false);
//     }
//   }

//   return (
//     <Card className="max-w-xl mx-auto shadow-lg border-0 bg-white dark:bg-gray-800 mt-12">
//       <CardHeader className="text-center pb-6">
//         <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
//           Student Report Generation
//         </CardTitle>
//         <div className="text-gray-600 dark:text-gray-300 text-base py-2">
//           Generate and download a comprehensive PDF report for your current class & quizzes.<br />
//           Includes quiz statistics, explanations, individual performance, and actionable feedback for teaching improvement.
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <div className="flex justify-between">
//           <Button
//             onClick={handleGenerateReport}
//             disabled={isGenerating}
//             className="w-2/3 bg-blue-700 hover:bg-blue-800 text-white text-lg flex items-center justify-center disabled:opacity-60"
//           >
//             {isGenerating ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...
//               </>
//             ) : (
//               <>
//                 <FileText className="w-5 h-5 mr-2" />Generate Report PDF
//               </>
//             )}
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             disabled={isGenerating}
//             onClick={checkReport}
//             className="flex items-center ml-4 px-4"
//           >
//             <RefreshCcw className="w-5 h-5 mr-2" />
//             Check Existing
//           </Button>
//         </div>

//         {isGenerated && downloadUrl && (
//           <a
//             href={downloadUrl}
//             className="block mt-2 w-full bg-green-600 hover:bg-green-700 rounded-full text-white p-3 text-center font-semibold text-lg transition"
//             target="_blank"
//             rel="noopener noreferrer"
//             download
//           >
//             <DownloadCloud className="w-5 h-5 inline-block -mt-1 mr-1" />
//             Download Latest Report
//           </a>
//         )}

//         {generationTime && (
//           <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 flex items-center">
//             <ShieldCheck className="w-4 h-4 mr-1 text-blue-600" />
//             Last Generated: <span className="ml-2">{generationTime}</span>
//           </div>
//         )}

//         {isGenerated && (
//           <div className="flex items-center bg-green-50 border border-green-200 dark:bg-green-800 dark:border-green-700 rounded-lg p-3 mt-4">
//             <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
//             <span className="text-green-800 dark:text-green-100 font-semibold">
//               Report is ready to download and review with your students!
//             </span>
//           </div>
//         )}

//         {error && (
//           <div className="flex items-center bg-red-50 border border-red-200 dark:bg-red-800 dark:border-red-700 rounded-lg p-3 mt-4">
//             <FileWarning className="w-5 h-5 text-red-700 mr-2" />
//             <span className="text-red-800 dark:text-red-100">{error}</span>
//           </div>
//         )}

//         <hr className="my-6" />

//         <div className="text-sm text-gray-700 dark:text-gray-300">
//           <strong>Note for Teachers:</strong> <br />
//           This report includes anonymised student results, question-level analytics, and detailed feedback to help you reflect and iterate on your teaching. Please ensure all necessary quiz and student data has been generated beforehand.<br />
//           For privacy, keep reports secure when sharing.
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, FileText, DownloadCloud, CheckCircle } from "lucide-react";

export function GenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Starting report generation...");
  
  // Messages to cycle during loading
  const loadingMessages = [
    "Loading student profiles...",
    "Loading student results...",
    "Generating specific details...",
    "Analyzing quiz data...",
    "Compiling performance metrics...",
    "Creating visualizations...",
    "Finalizing report layout...",
    "Almost done..."
  ];
  
  // Index ref for cycling loading messages
  const messageIndex = useRef(0);
  const messageInterval = useRef<number | null>(null);

  async function handleGenerateReport() {
    setIsGenerating(true);
    setError(null);
    setIsGenerated(false);
    setLoadingMessage("Starting report generation...");
    messageIndex.current = 0;

    // Start cycling loading messages every 2 seconds
    messageInterval.current = window.setInterval(() => {
      messageIndex.current = (messageIndex.current + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex.current]);
    }, 2000);

    // Simulate a delay between 15 to 20 seconds
    const simulatedDuration = 15000 + Math.floor(Math.random() * 5000);
    console.log(`[GenerateReport] Simulating report generation for ${simulatedDuration}ms`);

    setTimeout(() => {
      // Stop cycling messages
      if (messageInterval.current !== null) {
        clearInterval(messageInterval.current);
        messageInterval.current = null;
      }
      setIsGenerating(false);
      setIsGenerated(true);
      setLoadingMessage("");
    }, simulatedDuration);
  }

  // Local path for the PDF file inside public folder (adjust if needed)
  const localPDFUrl = "/reports/comprehensive_class_report.pdf";

  return (
    <Card className="max-w-5xl mx-auto shadow-lg border-0 bg-white dark:bg-gray-800 mt-12 p-4">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Student Report Generation
        </CardTitle>
        <div className="text-gray-600 dark:text-gray-300 text-base py-2">
           Generate and download a comprehensive PDF report for your current class & quizzes.<br />
           Includes quiz statistics, explanations, individual performance, and actionable feedback for teaching improvement.
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-2/3 bg-blue-700 hover:bg-blue-800 text-white text-lg flex items-center justify-center disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />Start Report Generation
              </>
            )}
          </Button>
        </div>

        {/* Dynamic loading status message */}
        {isGenerating && (
          <div className="mt-4 text-center text-lg text-blue-700 dark:text-blue-400 font-semibold">
            {loadingMessage}
          </div>
        )}

        {/* Show embedded PDF and download button after "generation" */}
        {isGenerated && (
          <>
            <div className="mt-4 text-center font-semibold text-green-800 dark:text-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              Report is ready to view! You can scroll below or download.
            </div>
            
            <div className="mt-6 w-full h-[700px] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={localPDFUrl}
                title="Comprehensive Class Report"
                width="100%"
                height="100%"
                className="block"
              />
            </div>

            <a
              href={localPDFUrl}
              download="comprehensive_class_report.pdf"
              className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full transition"
            >
              <DownloadCloud className="inline-block w-5 h-5 mr-2 -mt-1" />
              Download Report PDF
            </a>
          </>
        )}

        {/* Error display (optional) */}
        {error && (
          <div className="flex items-center bg-red-50 border border-red-200 dark:bg-red-800 dark:border-red-700 rounded-lg p-3 mt-4">
            <FileText className="w-5 h-5 text-red-700 mr-2" />
            <span className="text-red-800 dark:text-red-100">{error}</span>
          </div>
        )}

         <div className="text-sm text-gray-700 dark:text-gray-300">
           <strong>Note for Teachers:</strong> <br />
           This report includes anonymised student results, question-level analytics, and detailed feedback to help you reflect and iterate on your teaching. Please ensure all necessary quiz and student data has been generated beforehand.<br />
           For privacy, keep reports secure when sharing.
         </div>
      </CardContent>
    </Card>
  );
}
