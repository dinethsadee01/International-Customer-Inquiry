import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Download, RotateCcw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPDF: () => void;
  onStartOver: () => void;
  customerName: string;
  isDownloading?: boolean;
}

export default function SuccessModal({
  isOpen,
  onDownloadPDF,
  onStartOver,
  customerName,
  isDownloading = false,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onStartOver}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 text-center relative">
                <button
                  onClick={onStartOver}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-4"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  Inquiry Submitted Successfully!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-green-100 text-sm"
                >
                  Thank you, {customerName}!
                </motion.p>
              </div>

              <CardContent className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mb-6"
                >
                  <p className="text-gray-700 mb-4">
                    Your travel inquiry has been sent to our travel consultants.
                    We'll contact you within 24-48 hours with a customized
                    proposal.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      📧 <strong>Confirmation emails sent to:</strong>
                      <br />
                      • Your email address
                      <br />• Our travel agency
                    </p>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={onDownloadPDF}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download Inquiry PDF
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={onStartOver}
                    variant="outline"
                    className="w-full py-3 text-base font-medium border-gray-300 hover:bg-gray-50"
                    size="lg"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Start New Inquiry
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 pt-4 border-t border-gray-200 text-center"
                >
                  <p className="text-xs text-gray-500">
                    Need immediate assistance? Contact our support team.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
