import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Award, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  pathTitle: string;
  certificateNumber: string;
  issuedDate: string;
}

export function CertificateModal({
  open,
  onOpenChange,
  userName,
  pathTitle,
  certificateNumber,
  issuedDate,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0f',
      });
      
      const link = document.createElement('a');
      link.download = `SkillForge-Certificate-${certificateNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Certificate downloaded!');
    } catch (error) {
      // Fallback: copy certificate info
      toast.error('Download failed. Certificate info copied to clipboard.');
      navigator.clipboard.writeText(
        `SkillForge Certificate\n${userName}\n${pathTitle}\nIssued: ${issuedDate}\nID: ${certificateNumber}`
      );
    }
  };

  const shareCertificate = async () => {
    const shareText = `🎓 I just earned my ${pathTitle} certificate from SkillForge! #SkillForge #Learning #TechCareer`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'SkillForge Certificate',
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Share text copied to clipboard!');
    }
  };

  const formattedDate = new Date(issuedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Your Certificate
          </DialogTitle>
          <DialogDescription>
            Congratulations on completing the learning path!
          </DialogDescription>
        </DialogHeader>

        {/* Certificate Preview */}
        <div 
          ref={certificateRef}
          className="bg-gradient-to-br from-background via-card to-background p-8 rounded-xl border-2 border-primary/30 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Award className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-primary tracking-wide">SKILLFORGE</h2>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Certificate of Completion</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            {/* Main Content */}
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">This is to certify that</p>
              <h3 className="text-3xl font-bold text-foreground">{userName || 'Student'}</h3>
              <p className="text-sm text-muted-foreground">has successfully completed</p>
              <h4 className="text-xl font-semibold text-primary">{pathTitle}</h4>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
              <div className="text-left">
                <p className="font-semibold">Issue Date</p>
                <p>{formattedDate}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Certificate ID</p>
                <p className="font-mono">{certificateNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={shareCertificate}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={downloadCertificate}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
