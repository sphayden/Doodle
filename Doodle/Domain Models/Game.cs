using Doodle.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Doodle.Domain_Models
{
    public class Game
    {
        public String GameID;

        public String Term = "";

        public GameTimer Timer = new GameTimer();
        public GameTimer ImageTimer = new GameTimer();
        public GameTimer JudgementTimer = new GameTimer();
        public GameTimer VoteTimer = new GameTimer();

        public int AIVotes = 0;
        public int PeerVotes = 0;

        public List<Player> Players = new List<Player>();

        public Game()
        {
            GameID = Guid.NewGuid().ToString();

            Timer.Interval = 30000;
            ImageTimer.Interval = 2000;
            JudgementTimer.Interval = 10000;
            VoteTimer.Interval = 10000;

            Timer.GameID = GameID;
            ImageTimer.GameID = GameID;
            JudgementTimer.GameID = GameID;
            VoteTimer.GameID = GameID;
        }
    }
}