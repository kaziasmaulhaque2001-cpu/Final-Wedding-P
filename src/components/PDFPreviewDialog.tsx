import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

interface PDFPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  filename?: string;
  onDownload?: () => void;
}

export const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({
  open,
  onClose,
  pdfUrl,
  title,
  filename = 'document.pdf',
  onDownload
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          className: 'border border-[#D4AF37]/35 bg-[#141413] text-white rounded-xl overflow-hidden'
        }
      }}
    >
      {/* Title Header with custom gold detailing */}
      <DialogTitle className="border-b border-[#D4AF37]/15 p-4 flex justify-between items-center bg-black/40">
        <Box className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D4AF37]" />
          <Typography variant="subtitle1" className="font-serif font-bold tracking-wider text-gold-gradient uppercase text-sm sm:text-base">
            {title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      {/* Main Preview Screen */}
      <DialogContent className="p-0 bg-[#0D0D0C] min-h-[400px] sm:min-h-[550px] flex flex-col justify-between">
        {pdfUrl ? (
          <Box className="relative w-full h-[400px] sm:h-[550px] bg-black">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              title="PDF Document Preview"
              className="w-full h-full border-0 rounded-none bg-black"
            />
            {/* Overlay Banner for mobile fallback or desktop helpers */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/80 border border-[#D4AF37]/20 backdrop-blur-md px-3 py-2 rounded-lg flex justify-between items-center text-[11px] text-gray-300 pointer-events-auto sm:text-xs">
              <span className="flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                {filename}
              </span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
              >
                Open Fullscreen <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Box>
        ) : (
          <Box className="flex flex-col items-center justify-center p-8 min-h-[400px] gap-3">
            <Box className="w-12 h-12 rounded-full border border-t-[#D4AF37] border-transparent animate-spin" />
            <Typography variant="body2" className="text-gray-400 font-mono text-xs uppercase tracking-widest">
              Preparing High-Fidelity PDF...
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Bottom Footer Actions */}
      <DialogActions className="p-3 border-t border-[#D4AF37]/15 bg-black/40 flex justify-between">
        <Typography variant="caption" className="text-gray-500 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest hidden sm:block">
          Asmaul Production © Secure Document Viewer
        </Typography>
        <Box className="flex gap-2 w-full sm:w-auto justify-end">
          {onDownload && (
            <Button
              onClick={onDownload}
              variant="contained"
              size="small"
              startIcon={<Download className="w-4 h-4" />}
              className="bg-[#D4AF37] text-black font-bold hover:bg-[#AA7C11] text-xs px-4"
            >
              Download PDF
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            className="border-gray-700 text-gray-300 hover:bg-white/5 text-xs px-4"
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
