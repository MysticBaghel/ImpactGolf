import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0e0e0e] w-full py-12 px-6 border-t border-[#3c4a42]/15">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="text-lg font-black text-[#e5e2e1] font-headline">ImpactGolf.</div>
          <p className="text-sm text-[#bbcabf] max-w-sm">
            Elevating the game of golf through conscious competition and radical transparency in charitable giving.
          </p>
          <div className="text-xs text-[#bbcabf]">© {new Date().getFullYear()} ImpactGolf. Elevated Charity.</div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-[#4edea3] font-headline font-bold text-sm">Legal</h5>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-xs text-[#bbcabf] hover:text-[#4edea3] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs text-[#bbcabf] hover:text-[#4edea3] transition-colors">Terms of Play</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-[#4edea3] font-headline font-bold text-sm">Connect</h5>
            <ul className="space-y-2">
              <li><Link href="/impact" className="text-xs text-[#bbcabf] hover:text-[#4edea3] transition-colors">Impact Report</Link></li>
              <li><Link href="/contact" className="text-xs text-[#bbcabf] hover:text-[#4edea3] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
