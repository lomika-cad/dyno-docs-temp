using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using AutoMapper;
using Domain.Entities.Operations;

namespace Application.UserStories.Operations.Places;

public class PlaceMappingProfile : Profile
{
    public PlaceMappingProfile()
    {
        // Request -> Entity
        CreateMap<PlaceRequest, Place>();

        // Entity -> Response
        CreateMap<Place, PlaceResponse>()
            .ForMember(dest => dest.Image1Url, opt => opt.MapFrom(src => 
                src.Image1 != null ? Convert.ToBase64String(src.Image1) : null))
            .ForMember(dest => dest.Image2Url, opt => opt.MapFrom(src => 
                src.Image2 != null ? Convert.ToBase64String(src.Image2) : null))
            .ForMember(dest => dest.Image3Url, opt => opt.MapFrom(src => 
                src.Image3 != null ? Convert.ToBase64String(src.Image3) : null))
            .ForMember(dest => dest.Image4Url, opt => opt.MapFrom(src => 
                src.Image4 != null ? Convert.ToBase64String(src.Image4) : null))
            .ForMember(dest => dest.Image5Url, opt => opt.MapFrom(src => 
                src.Image5 != null ? Convert.ToBase64String(src.Image5) : null));
    }
}

