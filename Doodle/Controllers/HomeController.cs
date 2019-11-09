using Doodle.Domain_Models;
using Doodle.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace Doodle.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            Player p = new Player();

            GameHub.NonLobbyPlayers.Add(p);

            ViewBag.playerID = p.PlayerID;

            return View();
        }
    }
}
