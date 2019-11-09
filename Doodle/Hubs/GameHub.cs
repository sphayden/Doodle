using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Timers;
using System.Web;
using Doodle.Domain_Models;
using Doodle.Utility;
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
                else if (Lobby.Players.Count == 3)
                {
                    Lobby.Timer.Stop();
                    Lobby.Timer.Start();
                }
                else if (Lobby.Players.Count == 4)
                {
                    Lobby.Timer.Interval = 10000;
                    Lobby.Timer.Start();
                }
                else if (Lobby.Players.Count != 1)
                {
                    return;
                }

                Groups.Add(Context.ConnectionId, "Lobby");
                p.ConnectionID = Context.ConnectionId;

                Clients.Caller.setTerms(Lobby.Terms);

                Clients.All.playerAddedToLobby(Lobby.Players.Select(p1 => p1.Name).ToList());
            }
        }

        void LobbyTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Lobby.Timer.Stop();
            StartGame();
        }

        void StartGame()
        {
            Game game = new Game();
            game.Term = Lobby.Terms.OrderBy(t => t.Value).First().Key;
            game.Players.AddRange(Lobby.Players);

            Lobby.Players.ForEach(p => Groups.Remove(p.ConnectionID, "Lobby"));
            Lobby.Players.ForEach(p => Groups.Add(p.ConnectionID, game.GameID));

            Games.Add(game);

            game.Timer.Elapsed += GameTimerElapsed;
            game.Timer.Start();

            Lobby = new Lobby();

            Clients.Group(game.GameID).startGame();
        }

        void GameTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Game game = Games.Find(g => g.GameID == (sender as GameTimer).GameID);

            game.Timer.Stop();

            game.ImageTimer.Elapsed += ImageTimerElapsed;
            game.ImageTimer.Start();

            Clients.Group(game.GameID).endGame();
        }

        void ImageTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Game game = Games.Find(g => g.GameID == (sender as GameTimer).GameID);

            game.ImageTimer.Stop();

            game.Players.FindAll(p => p.ImagePath == null).ForEach(p => Groups.Remove(p.ConnectionID, game.GameID));
            game.Players.RemoveAll(p => p.ImagePath == null);

            //game.Players.ForEach(p => p.PercentageMatch = getPercentageMatch(game.Term, p.ImagePath));

            if (game.Players.Count > 2)
            {
                Clients.Group(game.GameID).chooseJudgement();
            }
            else
            {
                Clients.Group(game.GameID).displayAIWinner();
            }
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