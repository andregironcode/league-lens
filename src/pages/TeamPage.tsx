import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TeamDetails } from '@/types';
import { getTeamDetails } from '@/services/teamService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Star, StarOff } from 'lucide-react';
import LoginDialog from '@/components/LoginDialog';
import { Button } from '@/components/ui/button';

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamData, setTeamData] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { followTeam, unfollowTeam, isTeamFollowed } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // Add this inside the component but outside of any existing JSX
  const handleFollowTeam = () => {
    if (!teamData?.team?.id) return;
    
    if (isTeamFollowed(teamData.team.id)) {
      unfollowTeam(teamData.team.id);
    } else {
      followTeam(teamData.team.id);
    }
  };

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (teamId) {
        setIsLoading(true);
        try {
          const details = await getTeamDetails(teamId);
          setTeamData(details);
        } catch (error) {
          console.error("Failed to fetch team details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading team details...</div>;
  }

  if (!teamData) {
    return <div className="container mx-auto p-4">Team not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={teamData.team.logo}
            alt={teamData.team.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{teamData.team.name}</h1>
            <p className="text-gray-500">League Standing: {teamData.leagueStanding}</p>
            {teamData.europeanCompetition && (
              <p className="text-gray-500">
                European Competition: {teamData.europeanCompetition} ({teamData.europeanStanding})
              </p>
            )}
          </div>
        </div>
        
        {/* Add the follow button alongside team name */}
        <Button
          variant="outline"
          className={isTeamFollowed(teamData?.team?.id || '') ? "bg-[#FFC30B]/10" : ""}
          onClick={handleFollowTeam}
        >
          {isTeamFollowed(teamData?.team?.id || '') ? (
            <>
              <StarOff className="mr-2 h-4 w-4" />
              Unfollow
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Follow
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>League Table</CardTitle>
            <CardDescription>Current standing in the league.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Position</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Played</TableHead>
                    <TableHead>Won</TableHead>
                    <TableHead>Drawn</TableHead>
                    <TableHead>Lost</TableHead>
                    <TableHead>GF</TableHead>
                    <TableHead>GA</TableHead>
                    <TableHead>GD</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData.leagueTable.map((row) => (
                    <TableRow key={row.position}>
                      <TableCell className="font-medium">{row.position}</TableCell>
                      <TableCell className="flex items-center space-x-2">
                        <img
                          src={row.team.logo}
                          alt={row.team.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{row.team.name}</span>
                      </TableCell>
                      <TableCell>{row.played}</TableCell>
                      <TableCell>{row.won}</TableCell>
                      <TableCell>{row.drawn}</TableCell>
                      <TableCell>{row.lost}</TableCell>
                      <TableCell>{row.goalsFor}</TableCell>
                      <TableCell>{row.goalsAgainst}</TableCell>
                      <TableCell>{row.goalDifference}</TableCell>
                      <TableCell>{row.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {teamData.europeanTable && (
          <Card>
            <CardHeader>
              <CardTitle>European Table</CardTitle>
              <CardDescription>Standing in the European competition.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Position</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Played</TableHead>
                      <TableHead>Won</TableHead>
                      <TableHead>Drawn</TableHead>
                      <TableHead>Lost</TableHead>
                      <TableHead>GF</TableHead>
                      <TableHead>GA</TableHead>
                      <TableHead>GD</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamData.europeanTable.map((row) => (
                      <TableRow key={row.position}>
                        <TableCell className="font-medium">{row.position}</TableCell>
                        <TableCell className="flex items-center space-x-2">
                          <img
                            src={row.team.logo}
                            alt={row.team.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{row.team.name}</span>
                        </TableCell>
                        <TableCell>{row.played}</TableCell>
                        <TableCell>{row.won}</TableCell>
                        <TableCell>{row.drawn}</TableCell>
                        <TableCell>{row.lost}</TableCell>
                        <TableCell>{row.goalsFor}</TableCell>
                        <TableCell>{row.goalsAgainst}</TableCell>
                        <TableCell>{row.goalDifference}</TableCell>
                        <TableCell>{row.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Fixtures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamData.fixtures.map((fixture) => (
            <Card key={fixture.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</span>
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{format(new Date(fixture.date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{fixture.venue || 'Unknown Venue'}</span>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        action="follow this team"
      />
    </div>
  );
};

export default TeamPage;
