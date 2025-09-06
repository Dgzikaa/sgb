export default function TestPage() {
  const loading = false;
  
  if (loading) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <div>
      <h1>Test</h1>
    </div>
  );
}
