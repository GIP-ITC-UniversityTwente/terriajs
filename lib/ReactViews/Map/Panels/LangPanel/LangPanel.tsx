import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import Box from "../../../../Styled/Box";
import { RawButton } from "../../../../Styled/Button";
import Icon from "../../../../Styled/Icon";
import Ul, { Li } from "../../../../Styled/List";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import Styles from "../../MenuBar/menu-bar.scss";
import { set } from "lodash";

const stripLangLocale = (lang: string = ""): string => lang.split("-")[0];

type Props = {
  terria: Terria;
  smallScreen: boolean;
};

const LangPanel = (props: Props) => {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = React.useState(i18n.language);
  const [currentLanguageName, setCurrentLanguageName] = React.useState("");

  const languageMap = (props.terria.configParameters.languageConfiguration
    ?.languages ?? {}) as { [key: string]: string };

  if (!languageMap) {
    return null;
  }

  useEffect(() => {
    const langFromUrl = new URLSearchParams(location.search).get("lang");
    if (langFromUrl) {
      i18n.changeLanguage(langFromUrl);
    } else {
      i18n.changeLanguage("en");
    }

    const currentLanguageName = getLanguageName();
    setLang(i18n.language);
    setCurrentLanguageName(currentLanguageName);
  }, [i18n]);

  const getLanguageName = () => {
    const langFromUrl: string | null = new URLSearchParams(location.search).get(
      "lang"
    );

    if (langFromUrl) {
      setLang(langFromUrl);
      return languageMap[langFromUrl];
    } else {
      const fallbackLanguage = "en";
      const lang = "English";
      setLang(fallbackLanguage);
      updateUrlParameter("lang", fallbackLanguage);
      return lang;
    }
  };

  const updateUrlParameter = (key: string, value: string) => {
    const params = new URLSearchParams(location.search);
    params.set(key, value);
    window.location.search = params.toString();
  };

  const languageChanged = (lang: string) => {
    setLang(lang);
    i18n.changeLanguage(lang);
  };

  const onLanguageSelectorClick = (key: string) => {
    languageChanged(key);
    updateUrlParameter("lang", key);
  };

  return (
    //@ts-expect-error - not yet ready to tackle tsfying MenuPanel
    <MenuPanel
      theme={{
        btn: Styles.langBtn,
        icon: Icon.GLYPHS.globe
      }}
      btnText={
        props.smallScreen
          ? t("languagePanel.changeLanguage")
          : stripLangLocale(i18n.language)
      }
      mobileIcon={Icon.GLYPHS.globe}
      smallScreen={props.smallScreen}
    >
      <Box styledPadding={"20px 10px 10px 10px"}>
        <Ul
          spaced
          lined
          fullWidth
          column
          css={`
            padding-left: 0;
          `}
        >
          {Object.entries(languageMap).map(([key, value]) => (
            <Li key={key}>
              <RawButton onClick={() => onLanguageSelectorClick(key)}>
                {value}
              </RawButton>
            </Li>
          ))}
        </Ul>
      </Box>
    </MenuPanel>
  );
};
export default LangPanel;
