const nodes = [
  { left: "9%", top: "18%", delay: "0s" },
  { left: "21%", top: "72%", delay: "1.8s" },
  { left: "38%", top: "28%", delay: "3.1s" },
  { left: "61%", top: "66%", delay: "0.9s" },
  { left: "78%", top: "22%", delay: "2.4s" },
  { left: "88%", top: "78%", delay: "4.1s" },
  { left: "50%", top: "88%", delay: "1.2s" },
];

export function ValidatorFieldBackground() {
  return (
    <div aria-hidden="true" className="validator-field pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="validator-base" />
      <div className="validator-aurora validator-aurora-a" />
      <div className="validator-aurora validator-aurora-b" />
      <div className="validator-signal validator-signal-a" />
      <div className="validator-signal validator-signal-b" />
      <div className="validator-signal validator-signal-c" />
      <div className="validator-nodes">
        {nodes.map((node) => (
          <span key={`${node.left}-${node.top}`} className="validator-node" style={{ left: node.left, top: node.top, animationDelay: node.delay }} />
        ))}
      </div>
      <div className="validator-noise" />
    </div>
  );
}
