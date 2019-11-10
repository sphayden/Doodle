using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Doodle.Domain_Models
{
    public class Player
    {
        [JsonIgnore]
        public String PlayerID;

        public String ImagePath;

        [JsonIgnore]
        public String ImageFullPath;

        public String Name;

        public int PercentageMatch;

        public double Votes = 0;

        [JsonIgnore]
        public int TermVotes = 1;

        [JsonIgnore]
        public int JudgingVotes = 1;

        [JsonIgnore]
        public int PlayerVotes = 2;

        [JsonIgnore]
        public String ConnectionID;

        public Player()
        {
            PlayerID = Guid.NewGuid().ToString();
        }
    }
}