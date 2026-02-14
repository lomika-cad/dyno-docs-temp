using Microsoft.AspNetCore.Mvc;
using ChatApp.Models;
using ChatApp.Services;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly IWeatherForecastService _weatherForecastService;

        public HomeController(IWeatherForecastService weatherForecastService)
        {
            _weatherForecastService = weatherForecastService;
        }

        [HttpGet]
        public IEnumerable<WeatherForecast> Get()
        {
            return _weatherForecastService.GetWeatherForecasts();
        }
    }
}
