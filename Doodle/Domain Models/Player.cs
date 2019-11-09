using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Doodle.Domain_Models
{
    public class Player
    {
        public String PlayerID;

        public String ImagePath;

        public String Name;

        public int PercentageMatch;

        public int TermVotes = 2;

        public int JudgingVotes = 1;

        public String ConnectionID;

        public Player()
        {
            PlayerID = Guid.NewGuid().ToString();
        }
    }
}