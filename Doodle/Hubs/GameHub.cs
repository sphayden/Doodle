using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
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

        public void ValidateName(String playerName)
        {
            Player p = Lobby.Players.Find(p1 => p1.Name == playerName);

            if (p == null)
            {
                Clients.Caller.nameIsValid();
            }
            else
            {
                Clients.Caller.nameIsNotValid();
            }
        }

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

        public override Task OnDisconnected(bool stopCalled)
        {
            Player p = Lobby.Players.Find(p1 => p1.ConnectionID == Context.ConnectionId);

            if ( p != null)
            {
                Groups.Remove(p.ConnectionID, "Lobby");
                Lobby.Players.Remove(p);

                if (Lobby.Players.Count < 2)
                {
                    Lobby.Timer.Stop();
                }

                Clients.All.playerRemovedFromLobby(p.Name);
            }
            else
            {
                Game gameToReset = null;
                Games.ForEach(g =>
                {
                    Player gp = g.Players.Find(p1 => p1.ConnectionID == Context.ConnectionId);
                    
                    if (gp != null)
                    {
                        if (g.Players.Count - 1 <= 1)
                        {
                            gameToReset = g;
                        }
                    }
                });

                if (gameToReset != null)
                {
                    gameToReset.Timer.Stop();
                    gameToReset.ImageTimer.Stop();
                    gameToReset.JudgementTimer.Stop();
                    gameToReset.VoteTimer.Stop();
                    Clients.Group(gameToReset.GameID).terminateGame();
                    ResetGame(gameToReset);
                }
            }

            return base.OnDisconnected(stopCalled);
        }

        void LobbyTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Lobby.Timer.Stop();
            StartGameAsync();
        }

        async System.Threading.Tasks.Task StartGameAsync()
        {
            Game game = new Game();
            game.Term = Lobby.Terms.OrderByDescending(t => t.Value).First().Key;
            game.Players.AddRange(Lobby.Players);

            Lobby.Players.ForEach(p => Groups.Remove(p.ConnectionID, "Lobby"));

            foreach (Player p in Lobby.Players)
            {
                await Groups.Add(p.ConnectionID, game.GameID);
            }

            Games.Add(game);

            game.Timer.Elapsed += GameTimerElapsed;
            game.Timer.Start();

            Lobby = new Lobby();

            Clients.Group(game.GameID).startGame(game.Term);
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

            game.Players.ForEach(p => p.PercentageMatch = GetPercentageMatch(game.Term, p.ImageFullPath));

            if (game.Players.Count > 2)
            {
                game.JudgementTimer.Elapsed += JudgementTimerElapsed;
                game.JudgementTimer.Start();
                Clients.Group(game.GameID).chooseJudgement();
            }
            else
            {
                int highestMatch = game.Players.OrderByDescending(p => p.PercentageMatch).First().PercentageMatch;

                List<Player> topPlayers = game.Players.FindAll(p => p.PercentageMatch == highestMatch).ToList();

                if (topPlayers.Count > 1)
                {
                    Clients.Group(game.GameID).displayAIWinner(
                        null,
                        game.Players
                    );
                }
                else
                {
                    Clients.Group(game.GameID).displayAIWinner(
                        topPlayers.OrderByDescending(p => p.PercentageMatch).First(),
                        game.Players
                    );
                }

                ResetGame(game);
            }
        }

        void JudgementTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Game game = Games.Find(g => g.GameID == (sender as GameTimer).GameID);

            game.JudgementTimer.Stop();

            if (game.AIVotes > game.PeerVotes)
            {
                Clients.Group(game.GameID).displayAIWinner(
                        game.Players.OrderByDescending(p => p.PercentageMatch).First(),
                        game.Players
                    );

                ResetGame(game);
            }
            else if (game.AIVotes < game.PeerVotes)
            {
                game.VoteTimer.Elapsed += VotingTimerElapsed;
                game.VoteTimer.Start();
                Clients.Group(game.GameID).voteOnWinner(game.Players);
            }
            else
            {
                Random ran = new Random();
                int ranInt = ran.Next(2);

                if (ranInt == 0)
                {
                    Clients.Group(game.GameID).displayAIWinner(
                        game.Players.OrderByDescending(p => p.PercentageMatch).First(),
                        game.Players
                    );

                    ResetGame(game);
                }
                else if (ranInt == 1)
                {
                    game.VoteTimer.Elapsed += VotingTimerElapsed;
                    game.VoteTimer.Start();
                    Clients.Group(game.GameID).voteOnWinner(game.Players);
                }
            }
        }

        void VotingTimerElapsed(object sender, ElapsedEventArgs e)
        {
            Game game = Games.Find(g => g.GameID == (sender as GameTimer).GameID);

            game.VoteTimer.Stop();

            double highestVotes = game.Players.OrderByDescending(p => p.Votes).First().Votes;

            List<Player> topPlayers = game.Players.FindAll(p => p.Votes == highestVotes).ToList();

            if (topPlayers.Count > 1)
            {
                int highestMatch = topPlayers.OrderByDescending(p => p.PercentageMatch).First().PercentageMatch;

                List<Player> topTopPlayers = topPlayers.FindAll(p => p.PercentageMatch == highestMatch).ToList();

                if (topTopPlayers.Count > 1)
                {
                    Clients.Group(game.GameID).displayAIWinner(
                        null,
                        game.Players
                    );
                }
                else
                {
                    Clients.Group(game.GameID).displayAIWinner(
                        topTopPlayers.OrderByDescending(p => p.PercentageMatch).First(),
                        game.Players
                    );
                }

                ResetGame(game);
            }
            else
            {
                Clients.Group(game.GameID).displayWinner(
                       topPlayers.First(),
                       game.Players
                   );

                ResetGame(game);
            }
        }

        private int GetPercentageMatch(string term, string imagePath)
        {
            return Convert.ToInt32(GoogleVisionApiData.GetImageData(term, imagePath) * 100);
        }

        public void SendFriendInvite(String phoneNumber, String playerName)
        {
            //response = TwilioImageSender.InvitePlayers(phoneNumber, playerName);
        }

        public void VotePlayer(String playerID, String playerName)
        {
            Games.ForEach(g =>
            {
                Player p = g.Players.Find(p1 => p1.PlayerID == playerID);

                if (p != null)
                {
                    if (p.PlayerVotes > 0)
                    {
                        Player votingFor = g.Players.Find(p1 => p1.Name == playerName);
                        votingFor.Votes += (p.PlayerVotes / 2.0);
                        p.PlayerVotes--;
                    }
                }
            });
        }

        public void VoteAIJudgement(String playerID)
        {
            Games.ForEach(g =>
            {
                Player p = g.Players.Find(p1 => p1.PlayerID == playerID);

                if (p != null)
                {
                    if (p.JudgingVotes > 0)
                    {
                        p.JudgingVotes--;
                        g.AIVotes++;
                    }
                }
            });
        }

        public void VotePeerJudgement(String playerID)
        {
            Games.ForEach(g =>
            {
                Player p = g.Players.Find(p1 => p1.PlayerID == playerID);

                if (p != null)
                {
                    if (p.JudgingVotes > 0)
                    {
                        p.JudgingVotes--;
                        g.PeerVotes++;
                    }
                }
            });
        }

        public void ResetGame(Game game)
        {
            game.Players.ForEach(p => {
                Groups.Remove(p.ConnectionID, game.GameID);

                p.ImageFullPath = null;
                p.ImagePath = null;
                p.PercentageMatch = 0;
                p.Votes = 0;
                p.JudgingVotes = 1;
                p.PlayerVotes = 2;
                p.TermVotes = 1;
            });
            Games.Remove(game);
            NonLobbyPlayers.AddRange(game.Players);
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