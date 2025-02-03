import Link from "next/link";

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
      {/* ✅ Image à gauche */}
      <div className="w-16 h-16 overflow-hidden rounded-lg mr-4">
        <img src={imageSrc} alt={title} className="object-cover w-full h-full" />
      </div>

      {/* ✅ Texte à droite */}
      <article>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </article>
    </Link>
  );
}
