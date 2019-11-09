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

        public List<Player> Players = new List<Player>();

        public Game()
        {
            GameID = Guid.NewGuid().ToString();
        }
    }
}