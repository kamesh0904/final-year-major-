import { useState } from "react";
import { Brain, TrendingUp, Calendar, Download } from "lucide-react";
import WeeklyNeuroInsightReport from "./WeeklyNeuroInsightReport";

export default function WeeklyReportButton() {
  const [showReport, setShowReport] = useState(false);

  const downloadPDF = async () => {
    try {
      // Import jsPDF dynamically to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('Weekly Neuro-Insight Report', 20, 30);

      // Add date
      doc.setFontSize(12);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on: ${today}`, 20, 45);

      // Add content (this would be replaced with actual report data)
      doc.setFontSize(14);
      doc.text('Clinical Synthesis:', 20, 65);

      doc.setFontSize(10);
      const reportText = `This week's therapeutic gaming sessions show positive engagement patterns.
      
Key Achievements:
• Consistent daily engagement with cognitive exercises
• Improved focus and attention metrics
• Successful completion of therapeutic challenges

Focus Areas:
• Continue building on current momentum
• Explore new game modalities for enhanced benefits
• Maintain regular session consistency

Clinical Observation:
Your progress demonstrates strong commitment to mental wellness through
therapeutic gaming. The data indicates positive trends in cognitive
engagement and emotional regulation.`;

      const lines = doc.splitTextToSize(reportText, 170);
      doc.text(lines, 20, 80);

      // Save the PDF
      doc.save('weekly-neuro-insight-report.pdf');
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
                  <Brain className="text-purple-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Weekly Neuro-Insight Report</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg flex items-center gap-2 transition-colors"
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
            <WeeklyNeuroInsightReport onGenerateNew={() => { }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReport(true)}
      className="w-full glass rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover-lift group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
          <TrendingUp className="text-purple-400" size={20} />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Weekly Neuro-Insight Report</h3>
          <p className="text-gray-300 text-sm">
            Clinical synthesis of your therapeutic gaming progress
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar size={16} />
          <span>View Report</span>
        </div>
      </div>
    </button>
  );
}