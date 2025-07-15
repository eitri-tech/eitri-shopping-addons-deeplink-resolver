import { useTranslation } from "eitri-i18n";
import Eitri from "eitri-bifrost";
import { Text, View, Image, Button, Page } from "eitri-luminus";
import HeaderComponent from "../components/HeaderComponent";
import Presentation from "../assets/images/presentation.webp";

export default function Home(props) {
  const { t } = useTranslation();

  function goToProducts() {
    Eitri.navigation.navigate({ path: "/Products/ProductsList" });
    return
  }
  return (
    <Page className="w-screen h-screen">
      <View className="pt-8 w-full h-full">
        <HeaderComponent title={t("home.pageTitle")} />
        <Image className="w-screen" cover src={Presentation} />

        <View className="flex flex-col  w-screen h-full justify-between items-center p-4">
          <View className="prose">
            <Text render="h3" className="mb-12 font-bold">
              {t("home.title")}
            </Text>
            <Text render="p" className="my-8">
              {t("home.description")}
            </Text>
          </View>

          <Button
            className="btn btn-secondary mt-16 w-full"
            onClick={goToProducts}
          >
            {t("home.button")}
          </Button>
        </View>
      </View>
    </Page>
  );
}
