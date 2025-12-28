using System.Reflection;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace Domain.Extensions;

public static class JsonExtension
{
    public static T? FromJson<T>(this string value)
    {
        return JsonConvert.DeserializeObject<T>(value);
    }

    public static string ToJson(this object value)
    {
        return JsonConvert.SerializeObject(value);
    }

    public static IList<T> CloneList<T>(this IList<T> listToClone) where T : ICloneable
    {
        return listToClone.Select(item => (T)item.Clone()).ToList();
    }

    public static void CopyFieldsTo<T, TU>(this T source, TU dest)
    {
        var sourceFields = typeof(T).GetFields(BindingFlags.NonPublic | BindingFlags.Instance).ToList();
        var destFields = typeof(TU).GetFields(BindingFlags.NonPublic | BindingFlags.Instance).ToList();
        foreach (var sourceField in sourceFields)
        {
            if (destFields.Any(x => x.Name == sourceField.Name))
            {
                var f = destFields.First(x => x.Name == sourceField.Name);
                f.SetValue(dest, sourceField.GetValue(source));
            }
        }
    }
}

public static class StringExtension
{
    public static string? ToJson(this string value)
    {
        return JsonConvert.SerializeObject(value);
    }

    public static string FullTrim(this string value)
    {
        return Regex.Replace(value, @"\s+", "");
    }
}