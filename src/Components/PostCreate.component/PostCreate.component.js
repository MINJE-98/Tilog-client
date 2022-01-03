import React, { Component } from "react";
import Tiptap from "./slave.components/Editor.slave.component";
import { IconContext } from "react-icons";
import { FaTelegramPlane } from "react-icons/fa";

import { FaBookmark, FaHashtag } from "react-icons/fa";
import {
  createCategory,
  createPost,
  searchCategory,
  uploadImage,
} from "../../utilities/api";

// Toaster
import { toast } from "react-hot-toast";
import AddStepModal from "./slave.components/AddStopModal.slave.component";

export default class PostCreateComponent extends Component {
  state = {
    title: "", // 게시글 제목
    contentData: {}, // 게시글 내용
    isPrivate: false, // 비밀글 여부
    addStep: false, // 추가정보 입력모달 출력 여부
    isFetch: false, // API Fetch 유무
    tagInput: "", // 태그 라벨에 입력한 텍스트 데이터
    tagListData: [], // 등록한 태그 리스트 데이터
    tagRecommend: [], // 태그 추천 리스트 데이터
    categoryId: 1, // 카테고리가 지정되지 않았을 경우에 사용할 수 있는 태그의 기본값 입니다
    categoryInput: "", // 카테고리 라벨에 입력한 텍스트 데이터
    categoryIdData: { id: undefined, name: "" }, // 등록한 카테고리 ID
    categoryRecommend: [], // 카테고리 추천 리스트
  };
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    // 비 로그인 접근시
    if (!this.props.ISLOGIN) {
      // 메인페이지로 이동한다
      window.location.href = "/";
    }
  }

  /**
   * 추가정보입력 모달을 연다
   */
  openAddStepModal = () => {
    console.log(this.state.contentData);
    this.setState({ ...this.state, addStep: true });
  };

  /**
   * 추가정보 입력 모달을 닫는다
   */
  closeAddStepModal = () => {
    this.setState({ ...this.state, addStep: false });
  };

  /**
   * 게시글 입력 정보를 상태에 반영한다
   */
  setContent = async (contentData) => {
    await this.updateState({ ...this.state, contentData: contentData });
  };

  /**
   * 게시글 입력 정보를 반환한다
   */
  getContent = () => {
    return this.state.contentData;
  };

  /**
   * 타이틀 입력정보를 상태에 반영한다
   */
  titleFromChange = (event) => {
    this.setState({ ...this.state, title: event.target.value });
  };

  /**
   * 비밀글 설정 유무를 체크박스로 입력받는다
   */
  checkedPrivateBox = (event) => {
    this.setState({ ...this.state, isPrivate: event.target.checked });
  };

  /**
   * 피칭 상태 변경
   */
  setIsFetch = (fetchData) => {
    this.setState({ ...this.state, isFetch: fetchData });
  };

  /**
   * 카테고리 검색박스 입력 이벤트
   */
  setCategoryInput = async (event) => {
    const nowValue = event.target.value;
    const beforeValue = this.state.categoryInput;

    await this.updateState({ ...this.state, categoryInput: nowValue });

    // 글자수가 0일 경우 검색 결과 초기화
    if (nowValue.length === 0) {
      console.log("검색 기록 초기화");
      this.setState({ ...this.state, categoryRecommend: [] });
    }

    // 글자수 체크 후 검색 이벤트 발생
    if (beforeValue.length !== nowValue.length && nowValue.length > 0) {
      console.log("검색 이벤트 발생");
      this.getCategoryRecommend(nowValue);
    }
  };

  /**
   * 서비스에 카테고리 검색을 요청한다
   */
  getCategoryRecommend = async (nowValue) => {
    try {
      const result = await searchCategory(nowValue);
      this.setState({ ...this.state, categoryRecommend: result });
    } catch (error) {
      toast.error("카테고리 검색 실패");
    }
  };

  /**
   * 카테고리 선택 이벤트
   */
  setCategoryIdData = async (event) => {
    const id = event.currentTarget?.id || this.state.categoryId; // 카테고리 아이디를 만약 가져올 수 없을 경우 기본 아이디로 대체한다
    const textContent = event.currentTarget?.textContent || ""; // 카테고리 아이디를 만약 가져올 수 없을 경우 기본값으로 대체한다

    await this.updateState({
      ...this.state,
      categoryIdData: {
        id: +id,
        name: textContent,
      },
    });
    // 카테고리 추천 팝업 삭제
    await this.updateState({ ...this.state, categoryRecommend: [] });
    await this.updateState({ ...this.state, categoryInput: "" });
    console.log(this.state);
  };

  /**
   * 카테고리 선택 해제 이벤트
   */
  removeCategoryData = async () => {
    await this.updateState({
      ...this.state,
      categoryIdData: { id: undefined, name: "" },
    });
  };

  /**
   * 서비스에 카테고리 등록을 요청한다
   */
  setCategoryRequest = () => {};

  /**
   * 서비스에 게시글 등록 요청을 시작한다
   */
  setPostRequest = async () => {
    // 피칭 상태 설정
    this.setIsFetch(true);

    try {
      // 토스트 메시징
      toast("게시물을 등록하고 있습니다.");

      // 썸네일
      const thumbNailUrl = this.state.contentData?.content.find((content) => {
        if (content.type === "image") {
          return true;
        } else {
          return false;
        }
      });

      // DTO Mapping
      const requestData = {
        // 카테고리 아이디를 가져올 수 없을 경우 기본 카테고리로 대체한다
        categoryId: this.state.categoryIdData.id || this.state.categoryId,
        title: this.state.title,
        thumbNailUrl:
          thumbNailUrl?.attrs?.src ||
          "https://tilog-file-service-s3.s3.ap-northeast-2.amazonaws.com/1zm9rmmbir42021-12-26+12%3A37%3A18.png",
        markDownContent: JSON.stringify(this.state.contentData),
        private: this.state.isPrivate ? 1 : 0,
      };

      // 포스트 등록을 요청한다
      const requestResult = await createPost(requestData);

      // 상태를 변경하고 종료한다
      this.setIsFetch(false);

      // 토스트 메시징
      toast.success("게시글을 발행했습니다!");

      // 포스트 등록이 완료되더라도 대기한다
      await this.waitTime(3000);

      // 작성된 게시글로 이동 한다
      window.location.href = `/${this.props.USERINFO.userName}/${requestResult.data.postId}`;
    } catch (error) {
      // 토스트 메시징
      toast.error("게시글 등록에 실패했습니다..");

      // 포스트 등록에 실패하더라도 1초 대기한다
      await this.waitTime(1000);

      // 상태를 변경하고 종료한다
      this.setIsFetch(false);
    }
  };

  /**
   * 이미지 업로드를 요청한다
   */
  imageUpload = async (acceptedFiles) => {
    // 피칭 상태 설정
    this.setIsFetch(true);
    try {
      // 토스트 메시징
      toast("이미지를 업로드하고 있습니다.");

      const formData = new FormData();

      formData.append("file", acceptedFiles[0]);

      const result = await uploadImage(formData);

      // 토스트 메시징
      toast.success("이미지를 업로드했습니다");

      // 상태를 변경하고 종료한다
      this.setIsFetch(false);

      return result?.data;
    } catch (error) {
      // 토스트 메시징
      toast.error(
        "업로드에 실패했습니다 10메가 이하의 이미지만 등록할 수 있습니다"
      );
    }
  };

  /**
   *  동기화 리팩터링 펑션
   */
  updateState = (stateObject) => {
    return new Promise((resolve) => {
      this.setState(stateObject, () => {
        resolve();
      });
    });
  };
  waitTime = (delay) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delay);
    });
  };

  render() {
    return this.state.addStep ? (
      <AddStepModal
        closeAddStepModal={this.closeAddStepModal}
        setCategoryInput={this.setCategoryInput}
        categoryRecommend={this.state.categoryRecommend}
        setCategoryIdData={this.setCategoryIdData}
        categoryIdData={this.state.categoryIdData}
        setPostRequest={this.setPostRequest}
        removeCategoryData={this.removeCategoryData}
        categoryId={this.state.categoryId}
      />
    ) : (
      <div className="flex flex-col w-full h-full">
        {/* title */}
        <input
          type="title"
          name="title"
          placeholder="제목"
          onChange={this.titleFromChange}
          className="h-10 px-5 text-4xl text-gray-700 focus:outline-none m-5"
        />
        <hr className="mt-2" />
        {/* Editor Tiptap */}
        <Tiptap
          setContent={this.setContent}
          openAddStepModal={this.openAddStepModal}
          getContent={this.getContent}
          checkedPrivateBox={this.checkedPrivateBox}
          isFetch={this.state.isFetch}
          imageUpload={this.imageUpload}
        />
      </div>
    );
  }
}
