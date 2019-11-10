using Doodle.Domain_Models;
using Doodle.Hubs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
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

        [Route("SetImage")]
        public ActionResult SetImage(String PlayerID, String Image)
        {
            byte[] blob = Convert.FromBase64String(Image);

            var filename = ComputeSha256Hash(Convert.ToBase64String(blob)) + ".png";
            var path = Path.Combine(HttpContext.Server.MapPath("~"), "Images", "Temp");
            Directory.CreateDirectory(path);
            path = Path.Combine(path, filename);
            if (!System.IO.File.Exists(path))
            {
                using (MemoryStream ms = new MemoryStream(blob))
                {
                    using (FileStream fs = new FileStream(path, FileMode.OpenOrCreate, System.IO.FileAccess.Write))
                    {
                        ms.CopyTo(fs);
                        fs.Flush();
                    }
                }
            }

            GameHub.Games.ForEach(g =>
            {
                Player p = g.Players.Find(p1 => p1.PlayerID == PlayerID);

                if (p != null)
                {
                    p.ImagePath = "/Images/Temp/" + filename;
                    p.ImageFullPath = path;
                }
            });

            return new JsonResult();
        }

        string ComputeSha256Hash(string rawData)
        {
            // Create a SHA256   
            using (SHA256 sha256Hash = SHA256.Create())
            {
                // ComputeHash - returns byte array  
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

                // Convert byte array to a string   
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}
