using Doodle.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Doodle.Domain_Models
{
    public class Lobby
    {

        public Dictionary<string, int> Terms = new Dictionary<string, int>();

        public List<Player> Players = new List<Player>();

        public System.Timers.Timer Timer = new System.Timers.Timer();

        public Lobby()
        {
            ResetTerms();
            Timer.Interval = 30000;
        }

        public void ResetTerms()
        {
            Terms.Clear();
            TermUtility.getShortListOfTerms().ForEach(term => Terms.Add(term, 0));
        }

    }
}