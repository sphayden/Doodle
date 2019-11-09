using System;
using System.Collections.Generic;
using System.Linq;
using System.Timers;
using System.Web;
using Doodle.Domain_Models;
using Microsoft.AspNet.SignalR;

namespace Doodle.Hubs
{
    public class GameHub : Hub
    {
        public static Lobby Lobby = new Lobby();

        public static List<Player> NonLobbyPlayers = new List<Player>();

        public static List<Game> Games = new List<Game>();

        public void AddPlayerToLobby(String playerID, String playerName)
        {
            Player p = NonLobbyPlayers.Find(p1 => p1.PlayerID == playerID);

            if (p != null)
            {
                p.Name = playerName;
                Lobby.Players.Add(p);

                if (Lobby.Players.Count == 2)
                {
                    Lobby.Timer.Elapsed += LobbyTimerElapsed;
                    Lobby.Timer.Start();
                }
                else if (Lobby.Players.Count == 4)
                {

                }

                Clients.Caller.setTerms(Lobby.Terms);

                Clients.All.playerAddedToLobby(Lobby.Players.Select(p1 => p1.Name).ToList());
            }
        }

        void LobbyTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Lobby.Timer.Stop();
            StartGame();
            Clients.All.startGame();
        }

        void StartGame()
        {
            Game game = new Game();
            game.Term = Lobby.Terms.OrderBy(t => t.Value).First().Key;
            game.Players.AddRange(Lobby.Players);

            Lobby.Players.Clear();
            Lobby.ResetTerms();
        }

        public void VoteTerm(String playerID, String term)
        {
            if (Lobby.Players.Any(p => p.PlayerID == playerID))
            {
                Player p = Lobby.Players.Find(p1 => p1.PlayerID == playerID);

                if (p.TermVotes > 0)
                {
                    p.TermVotes--;
                    Clients.All.votedTerm(term, ++Lobby.Terms[term]);
                }
            }
        }
    }
}