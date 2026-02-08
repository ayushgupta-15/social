export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="text-center space-y-2">
        <div className="text-6xl font-bold">404</div>
        <div className="text-muted-foreground">Page not found</div>
      </div>
    </div>
  );
}
