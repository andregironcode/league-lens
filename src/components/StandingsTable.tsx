
import React from 'react';
import { TableRow } from '@/types';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow as UITableRow } from "@/components/ui/table";

interface StandingsTableProps {
  standings: TableRow[];
  title: string;
  isLoading?: boolean;
}

const StandingsTable = ({ standings, title, isLoading = false }: StandingsTableProps) => {
  if (isLoading) {
    return (
      <div className="w-full overflow-auto bg-highlight-800 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-highlight-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-8 bg-highlight-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="w-full overflow-auto bg-highlight-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-center py-4">No standings data available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-highlight-800 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-2 text-white">{title}</h3>
      <Table>
        <TableCaption>League standings as of {new Date().toLocaleDateString()}</TableCaption>
        <TableHeader>
          <UITableRow className="hover:bg-highlight-800">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center">PTS</TableHead>
          </UITableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row) => (
            <UITableRow key={row.team.id} className="hover:bg-highlight-700">
              <TableCell className="font-medium">
                <span className={`
                  ${row.position <= 4 ? 'text-green-500' : ''} 
                  ${row.position > 4 && row.position <= 6 ? 'text-blue-500' : ''}
                  ${row.position >= standings.length - 3 ? 'text-red-500' : ''}
                `}>
                  {row.position}
                </span>
              </TableCell>
              <TableCell className="flex items-center">
                <img 
                  src={row.team.logo} 
                  alt={row.team.name} 
                  className="w-5 h-5 mr-2 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://www.sofascore.com/static/images/placeholders/team.svg";
                  }}
                />
                <span className="text-white">{row.team.name}</span>
              </TableCell>
              <TableCell className="text-center">{row.played}</TableCell>
              <TableCell className="text-center">{row.won}</TableCell>
              <TableCell className="text-center">{row.drawn}</TableCell>
              <TableCell className="text-center">{row.lost}</TableCell>
              <TableCell className="text-center">{row.goalsFor}</TableCell>
              <TableCell className="text-center">{row.goalsAgainst}</TableCell>
              <TableCell className="text-center">{row.goalDifference}</TableCell>
              <TableCell className="text-center font-bold">{row.points}</TableCell>
            </UITableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StandingsTable;
