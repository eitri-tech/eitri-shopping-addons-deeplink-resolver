import Eitri from "eitri-bifrost";
import ArrowLeft from "../assets/icons/arrow-left.svg";
import { View, Text, Image, Button } from "eitri-luminus";

export default function HeaderComponent(props) {
  const onBackClick = () => {
    Eitri.navigation.back();
  };

  return (
    <View className="flex items-center p-2 w-full">
      <Button
        className="btn btn-circle rounded-full mr-4"
        onClick={onBackClick}
      >
        <Image src={ArrowLeft} width={18} height={18} />
      </Button>

      <Text render="h1" className="text-2xl text-center">
        {props.title || "Eitri Com luminus Daisy!"}
      </Text>
    </View>
  );
}
