import React from "react";

import {
    View,
    Text,
} from "react-native";

export default function DateSeparator({

    title,

}: {

    title: string;

}) {

    return (

        <View
            className="
            items-center
            my-5
            "
        >

            <View
                className="
                bg-white
                px-4
                py-2
                rounded-full
                "
            >

                <Text
                    className="
                    text-xs
                    text-neutral-500
                    "
                >
                    {title}
                </Text>

            </View>

        </View>

    );

}