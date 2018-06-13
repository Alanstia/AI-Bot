using System;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Connector;
using System.Collections.Generic;
using RestSharp;

namespace AI_Chatbot.Dialogs
{
    [Serializable]
    public class RootDialog : IDialog<object>
    {
        public Task StartAsync(IDialogContext context)
        {
            context.Wait(MessageReceivedAsync);

            return Task.CompletedTask;
        }

        private string key = "your_key";

        private async Task MessageReceivedAsync(IDialogContext context, IAwaitable<object> result)
        {
            var activity = await result as Activity;
            //LUIS撈資料
            var client = new RestClient("https://southeastasia.api.cognitive.microsoft.com/luis/v2.0/");
            var request = new RestRequest("apps/app_id", Method.GET);
            request.AddParameter("subscription-key", key);
            request.AddParameter("verbose", "true");
            request.AddParameter("timezoneOffset", "0");
            request.AddParameter("q", activity.Text);

            var response = await client.ExecuteTaskAsync<RootObject>(request);//LUIS回傳

            var suggestion = string.Empty;
            if (response.Data.intents.Count > 0)
            {
                string strIntent = response.Data.intents[0].intent;

                if (strIntent == "打招呼")
                {
                    await context.PostAsync($"您好，我是人工智慧點餐系統，代號為001，很高興為您服務!");
                }
                else if(strIntent == "點餐")
                {
                    string num = response.Data.entities.Find((x => x.type == "數量")).entity;
                    string item = response.Data.entities.Find((x => x.type == "商品")).entity;
                    await context.PostAsync($"好的，已為您點了{num}{item}");
                }
                else if (strIntent == "None")
                {
                    await context.PostAsync($"不好意思，我目前聽不懂這個詞呢");
                }
            }

            context.Wait(MessageReceivedAsync);
        }
    }
    public class TopScoringIntent
    {
        public string intent { get; set; }
        public double score { get; set; }
    }

    public class Intent
    {
        public string intent { get; set; }
        public double score { get; set; }
    }
    public class Entity
    {
        public string entity { get; set; }
        public string type { get; set; }
        public int startIndex { get; set; }
        public int endIndex { get; set; }
        public float score { get; set; }
    }
    public class RootObject
    {
        public string query { get; set; }
        public TopScoringIntent topScoringIntent { get; set; }
        public List<Intent> intents { get; set; }
        public List<Entity> entities { get; set; }
    }

   
}