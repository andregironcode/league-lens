import React from 'react';
import { StandingsRow, Team } from '@/types'; // Assuming StandingsRow and Team types are defined in @/types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UiTableRow } from '@/components/ui/table'; // Assuming you have these UI components

interface StandingsTableProps {
  standings: StandingsRow[];
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
  if (!standings || standings.length === 0) {
    return <p>No standings data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <UiTableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-center">MP</TableHead>
          <TableHead className="text-center">W</TableHead>
          <TableHead className="text-center">D</TableHead>
          <TableHead className="text-center">L</TableHead>
          <TableHead className="text-center">GF</TableHead>
          <TableHead className="text-center">GA</TableHead>
          <TableHead className="text-center">GD</TableHead>
          <TableHead className="text-right">Pts</TableHead>
        </UiTableRow>
      </TableHeader>
      <TableBody>
        {standings.map((row) => (
          <UiTableRow key={row.team.id}>
            <TableCell>{row.position}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <img src={row.team.logo || '/icons/default-team.png'} alt={row.team.name} className="w-5 h-5 object-contain" />
                <span>{row.team.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">{row.played}</TableCell>
            <TableCell className="text-center">{row.won}</TableCell>
            <TableCell className="text-center">{row.drawn}</TableCell>
            <TableCell className="text-center">{row.lost}</TableCell>
            <TableCell className="text-center">{row.goalsFor}</TableCell>
            <TableCell className="text-center">{row.goalsAgainst}</TableCell>
            <TableCell className="text-center">{row.goalDifference}</TableCell>
            <TableCell className="text-right">{row.points}</TableCell>
          </UiTableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StandingsTable; 