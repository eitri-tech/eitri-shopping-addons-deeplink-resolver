import { useEffect, useState } from "react";
import Eitri from "eitri-bifrost";
import { View, Text, Image, Page } from "eitri-luminus";
import { useTranslation } from "eitri-i18n";
import HeaderComponent from "../../components/HeaderComponent";

export default function ProductsList() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await Eitri.http.get(
        "https://calindra.tech/eitri/product_list.json"
      );

      setProducts(response.data.resultItems);
    } catch (error) {
      console.error(t("productList.errorLogMessage"), error);
    }
  };

  return (
    <Page className="pt-8 w-screen h-screen">
      <HeaderComponent title={t("productList.pageTitle")} />

      <View className="w-full">
        {products.map((product) => (
          <View className="flex flex-col w-full my-4 p-4" key={product.id}>
            <Image src={product.imageUrl} className="w-full h-60" />
            <Text render="h2">{product.title}</Text>
            <View className="prose">
              <Text render="p" className="text-green-600 font-bold text-lg">
                {Intl.NumberFormat(i18n.currentLanguage, {
                  style: "currency",
                  currency: "BRL",
                  currencyDisplay: "symbol",
                }).format(product.price / 100)}
              </Text>
            </View>

            <Text render="p">{product.description}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
