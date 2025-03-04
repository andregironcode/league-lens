
// In the getMatchById function, add null checks for v.id and v.matchId
export const getMatchById = async (matchId: string): Promise<MatchHighlight | null> => {
  try {
    const data = await fetchHighlights();
    if (data && data.response) {
      for (const v of data.response) {
        // Handle v.id null check
        if (v.id !== null && v.id !== undefined && v.id.toString() === matchId) {
          return mapToMatchHighlight(v);
        }
        
        // Handle v.matchId null check
        if (v.matchId !== null && v.matchId !== undefined && v.matchId.toString() === matchId) {
          return mapToMatchHighlight(v);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching match by ID:", error);
    return null;
  }
};
