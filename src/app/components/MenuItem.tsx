import Link from "next/link";
import Image from "next/image";

type MenuItemProps = {
  title: string;
  href: string;
  description: string;
  imageSrc: string;
};

export default function MenuItem({ title, href, description, imageSrc }: MenuItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-row items-center border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      {/* Image à gauche */}
      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg mr-4 relative">
        <Image 
          src={imageSrc} 
          alt={title} 
          fill
          style={{ objectFit: "cover" }}
          className="rounded-lg"
        />
      </div>

      {/* Texte à droite */}
      <article>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </article>
    </Link>
  );
}
