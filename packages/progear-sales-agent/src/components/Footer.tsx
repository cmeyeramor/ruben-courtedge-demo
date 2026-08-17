import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-primary py-4 flex items-center justify-center shrink-0">
      <Image
        src="/tec360-footer-slogan.png"
        alt="TEC360"
        width={220}
        height={45}
        className="h-8 w-auto opacity-90"
      />
    </footer>
  );
}
