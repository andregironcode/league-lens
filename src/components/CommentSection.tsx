
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage, DefaultProfileImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User } from 'lucide-react';
import LoginDialog from './LoginDialog';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

interface CommentSectionProps {
  matchId: string;
}

// Demo comments for illustration
const demoComments: Comment[] = [
  {
    id: '1',
    user: {
      name: 'Football Fan',
    },
    content: 'What a goal by the striker! Definitely goal of the month contender.',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    user: {
      name: 'TacticalAnalyst',
      avatar: 'https://github.com/shadcn.png'
    },
    content: 'The defensive setup from the away team was all wrong. They need to work on their positioning.',
    timestamp: '5 hours ago'
  }
];

const CommentSection: React.FC<CommentSectionProps> = ({ matchId }) => {
  const [comments, setComments] = useState<Comment[]>(demoComments);
  const [commentText, setCommentText] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { isLoggedIn, promptLogin } = useAuth();

  const handleSubmitComment = () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    if (commentText.trim() === '') return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: {
        name: 'You',
      },
      content: commentText,
      timestamp: 'Just now'
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Comments</h3>
      
      <div className="mb-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={isLoggedIn ? undefined : undefined} alt="User" />
            <AvatarFallback outlineStyle>
              <img 
                src={DefaultProfileImage} 
                alt="User" 
                className="h-full w-full object-cover"
              />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px] mb-2"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                className="bg-[#FFC30B] text-black hover:bg-[#FFC30B]/90"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
              <AvatarFallback outlineStyle>
                <img 
                  src={DefaultProfileImage} 
                  alt={comment.user.name} 
                  className="h-full w-full object-cover"
                />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{comment.user.name}</span>
                <span className="text-sm text-gray-500">{comment.timestamp}</span>
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
        action="comment on highlights"
      />
    </div>
  );
};

export default CommentSection;
