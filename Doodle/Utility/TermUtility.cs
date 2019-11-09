using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Doodle.Utility
{
    public class TermUtility
    {
        public static List<string> Terms = new List<string> { "Mug", "Mouse", "Car", "Flower", "Smile" };

        public static List<string> getShortListOfTerms()
        {
            List<string> termsCopy = Terms.Select(term => (String)term.Clone()).ToList();
            List<string> tmpTerms = new List<string>();

            Random rnd = new Random();

            for (int i = 0; i < 4; i++)
            {
                int index = rnd.Next(termsCopy.Count);
                tmpTerms.Add(termsCopy.ElementAt(index));
                termsCopy.RemoveAt(index);
            }

            return tmpTerms;
        }
    }
}