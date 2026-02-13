export default function PageHeader({
  title,
  ResponsivefontSize = false,
}: {
  title: string;
  ResponsivefontSize?: boolean;
}) {
  return (
    <div>
      {/* accent text color based on accent color  */}
      <h1
        className={` text-primary text-lg font-semibold text-md
          
          `}
      >
        {title}
      </h1>
    </div>
  );
}
