import { useState } from "react";
import { Sun, TrendingUp, Calendar, Download } from "lucide-react";
import DailyNeuroInsightReport from "./DailyNeuroInsightReport";

export default function DailyReportButton() {
    const [showReport, setShowReport] = useState(false);

    const downloadPDF = async () => {
        try {
            // Import jsPDF dynamically to avoid SSR issues
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF();

            // Add title
            doc.setFontSize(20);
            doc.text('Daily Neuro-Insight Report', 20, 30);

            // Add date
            doc.setFontSize(12);
            const today = new Date().toLocaleDateString();
            doc.text(`Generated on: ${today}`, 20, 45);

            // Add content (this would be replaced with actual report data)
            doc.setFontSize(14);
            doc.text('Daily Summary:', 20, 65);

            doc.setFontSize(10);
            const reportText = `Today's therapeutic gaming session summary:

Session Overview:
• Total gaming time: [Time will be calculated from actual data]
• Games played: [List of games from today's sessions]
• Engagement level: High

Key Insights:
• Maintained focus throughout gaming sessions
• Positive response to therapeutic challenges
• Consistent engagement with wellness activities

Recommendations:
• Continue current gaming routine
• Explore additional therapeutic modalities
• Maintain regular session timing

Daily Reflection:
Your commitment to mental wellness through therapeutic gaming
shows consistent progress. Today's activities demonstrate
positive engagement with cognitive exercises.`;

            const lines = doc.splitTextToSize(reportText, 170);
            doc.text(lines, 20, 80);

            // Save the PDF
            doc.save('daily-neuro-insight-report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    if (showReport) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                                    <Sun className="text-yellow-400" size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Daily Neuro-Insight Report</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadPDF}
                                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => setShowReport(false)}
                                    className="w-8 h-8 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors hover:bg-white/10"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <DailyNeuroInsightReport onGenerateNew={() => { }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowReport(true)}
            className="w-full glass rounded-2xl p-6 border border-white/10 hover:border-yellow-400/30 transition-all duration-300 hover-lift group"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                    <TrendingUp className="text-yellow-400" size={20} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Daily Neuro-Insight Report</h3>
                    <p className="text-gray-300 text-sm">
                        Today's snapshot of your mental wellness journey
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>View Today</span>
                </div>
            </div>
        </button>
    );
}