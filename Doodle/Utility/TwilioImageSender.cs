using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace Doodle.Utility
{
    public class TwilioImageSender
    {
        public static void InvitePlayers(string number, string friendName)
        {
            const string accountSid = "AC76060ffa70f3cd0ee403ea5fec6d50ba";
            const string authToken = "97c944068e04cf110a8b5368d1a103d8";

            TwilioClient.Init(accountSid, authToken);


            string TwilioNumber = "+1" + number;
            var message = MessageResource.Create(
                body: "Hi there! " + friendName + " invited you to play Doodle Dash!! Join now at doodledash.online!",
                from: new Twilio.Types.PhoneNumber("+12512701026"),
                to: new Twilio.Types.PhoneNumber(TwilioNumber)
            );


        }
    }
}