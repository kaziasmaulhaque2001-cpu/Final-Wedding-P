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
import {
  Sparkles,
  Eye,
  Download,
  Share2,
  MessageCircle,
  X,
  FileCheck
} from 'lucide-react';

interface PDFActionsTriggerDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  clientName: string;
  documentType: 'Booking Confirmation' | 'Payment Receipt' | 'Invoice' | 'Agreement';
  onAction: (action: 'preview' | 'download' | 'share' | 'whatsapp') => void;
}

export const PDFActionsTriggerDialog: React.FC<PDFActionsTriggerDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  clientName,
  documentType,
  onAction
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          className: 'border border-[#D4AF37]/35 bg-[#141413]/95 text-white rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.15)] backdrop-blur-md'
        }
      }}
    >
      {/* Header Close button */}
      <Box className="absolute right-2 top-2 z-10">
        <IconButton onClick={onClose} className="text-gray-500 hover:text-white p-1">
          <X className="w-5 h-5" />
        </IconButton>
      </Box>

      {/* Decorative Golden Top Aura */}
      <Box className="h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent w-full" />

      <DialogContent className="pt-6 pb-4 px-6 flex flex-col items-center text-center">
        {/* Animated Celebration Icon */}
        <Box className="w-14 h-14 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 flex items-center justify-center mb-4 relative">
          <FileCheck className="w-7 h-7 text-[#D4AF37]" />
          <Sparkles className="w-4 h-4 text-[#D4AF37] absolute -top-1.5 -right-1.5 animate-pulse" />
        </Box>

        {/* Success Header */}
        <Typography variant="h6" className="font-serif font-bold text-gold-gradient tracking-wider uppercase text-base mb-1">
          {title}
        </Typography>
        <Typography variant="caption" className="text-gray-400 font-medium block max-w-xs mb-3">
          {subtitle}
        </Typography>

        {/* Info card of document generated */}
        <Box className="w-full bg-black/40 border border-[#D4AF37]/10 rounded-xl p-3 mb-5 text-left">
          <Box className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Document Type</span>
            <span className="text-[9px] uppercase font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/20">Auto Prepared</span>
          </Box>
          <Typography variant="body2" className="text-gray-200 font-bold truncate">
            {documentType}
          </Typography>
          <span className="text-[11px] text-gray-400 block mt-1">
            Client: <b className="text-[#D4AF37]">{clientName}</b>
          </span>
        </Box>

        {/* Action Grid Buttons */}
        <Box className="flex flex-col gap-2 w-full">
          {/* 1. Preview PDF */}
          <Button
            onClick={() => onAction('preview')}
            variant="outlined"
            fullWidth
            startIcon={<Eye className="w-4 h-4" />}
            className="border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 py-2 rounded-xl text-xs font-bold font-serif tracking-widest justify-start px-4"
          >
            Preview PDF Document
          </Button>

          {/* 2. Download PDF */}
          <Button
            onClick={() => onAction('download')}
            variant="outlined"
            fullWidth
            startIcon={<Download className="w-4 h-4" />}
            className="border-gray-700 text-gray-200 hover:bg-white/5 py-2 rounded-xl text-xs font-bold font-serif tracking-widest justify-start px-4"
          >
            Download PDF File
          </Button>

          {/* 3. Share PDF */}
          <Button
            onClick={() => onAction('share')}
            variant="outlined"
            fullWidth
            startIcon={<Share2 className="w-4 h-4" />}
            className="border-gray-700 text-gray-200 hover:bg-white/5 py-2 rounded-xl text-xs font-bold font-serif tracking-widest justify-start px-4"
          >
            Share PDF File
          </Button>

          {/* 4. Share on WhatsApp */}
          <Button
            onClick={() => onAction('whatsapp')}
            variant="contained"
            fullWidth
            startIcon={<MessageCircle className="w-4 h-4" />}
            className="bg-[#25D366] text-black hover:bg-[#20ba56] py-2.5 rounded-xl text-xs font-bold font-serif tracking-widest justify-start px-4 shadow-[0_4px_12px_rgba(37,211,102,0.15)] mt-1"
          >
            Share on WhatsApp
          </Button>
        </Box>
      </DialogContent>

      <DialogActions className="px-6 pb-4 pt-1 justify-center border-t border-[#D4AF37]/10 bg-black/20">
        <Button
          onClick={onClose}
          size="small"
          className="text-gray-400 hover:text-white font-mono text-[10px] tracking-widest"
        >
          Dismiss Action Panel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
