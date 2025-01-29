import { useReadContract } from "thirdweb/react";
import { nftpNftsEd1Contract } from "../constants";

export default function ClaimConditionComponent() {
  const { data, isPending, error } = useReadContract({
    contract: nftpNftsEd1Contract,
    method:
      "function claimCondition() view returns (uint256 currentStartId, uint256 count)",
    params: [],
  });

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Claim Condition Status</h2>

      {isPending ? (
        <p>Loading claim conditions...</p>
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error.message}</p>
      ) : data ? (
        <div>
          <p><strong>Current Start ID:</strong> {data[0].toString()}</p>
          <p><strong>Count:</strong> {data[1].toString()}</p>
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
}
